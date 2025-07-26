const express = require("express");
const documentService = require("../services/documentService");
const supabase = require("../config/supabase");
const router = express.Router();

// Process document from Supabase storage
router.post("/process/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    console.log("Processing document:", documentId);

    // Get document record from database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (dbError || !document) {
      console.log("Document not found:", dbError);
      return res.status(404).json({ error: "Document not found" });
    }

    // Download file from Supabase storage
    const { data: fileData, error: storageError } = await supabase.storage
      .from("aibot")
      .download(document.file_path);

    if (storageError) {
      console.error("Error downloading file from storage:", storageError);
      return res.status(500).json({
        error: "Failed to download file from storage",
        details: storageError.message,
      });
    }

    // Convert file data to buffer for processing
    const fileBuffer = Buffer.from(await fileData.arrayBuffer());

    // Extract text from the document
    const extractedText = await documentService.extractTextFromBuffer(
      fileBuffer,
      document.mime_type,
      document.original_name
    );

    // Update document record with extracted text
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        extracted_text: extractedText,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document:", updateError);
      return res.status(500).json({
        error: "Failed to update document",
        details: updateError.message,
      });
    }

    res.json({
      success: true,
      documentId,
      extractedText,
      message: "Document processed successfully",
    });
  } catch (error) {
    console.error("Error processing document:", error);
    res.status(500).json({
      error: "Failed to process document",
      details: error.message,
    });
  }
});

// Get document content by document ID
router.get("/content/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;

    // Get document from database
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (dbError || !document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // If document doesn't have extracted text, process it
    if (!document.extracted_text) {
      // Download and process the file
      const { data: fileData, error: storageError } = await supabase.storage
        .from("aibot")
        .download(document.file_path);

      if (storageError) {
        return res.status(500).json({
          error: "Failed to download file from storage",
          details: storageError.message,
        });
      }

      const fileBuffer = Buffer.from(await fileData.arrayBuffer());
      const extractedText = await documentService.extractTextFromBuffer(
        fileBuffer,
        document.mime_type,
        document.original_name
      );

      // Update document with extracted text
      await supabase
        .from("documents")
        .update({
          extracted_text: extractedText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId);

      document.extracted_text = extractedText;
    }

    res.json({
      documentId,
      content: document.extracted_text,
      originalName: document.original_name,
      mimeType: document.mime_type,
      fileSize: document.file_size,
      createdAt: document.created_at,
    });
  } catch (error) {
    console.error("Error retrieving document content:", error);
    res.status(500).json({
      error: "Failed to retrieve document content",
      details: error.message,
    });
  }
});

// Get all unprocessed documents for a user
router.get("/unprocessed/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: documents, error } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .is("extracted_text", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      documents: documents || [],
      count: documents?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching unprocessed documents:", error);
    res.status(500).json({
      error: "Failed to fetch unprocessed documents",
      details: error.message,
    });
  }
});

module.exports = router;
