const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const textract = require("textract");
const { createWorker } = require("tesseract.js");

class DocumentService {
  /**
   * Check if file is an image based on mime type
   */
  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith("image/");
  }

  /**
   * Extract text from image using OCR
   */
  async extractTextFromImageBuffer(buffer, mimeType) {
    try {
      // First try textract
      try {
        return await this.extractWithTextractBuffer(
          buffer,
          `image.${mimeType.split("/")[1]}`
        );
      } catch (textractError) {
        console.log(
          "Textract failed for image, trying Tesseract OCR:",
          textractError.message
        );

        // Fallback to Tesseract.js OCR
        const worker = await createWorker();
        await worker.loadLanguage("eng");
        await worker.initialize("eng");

        // Convert buffer to base64 for Tesseract
        const base64Image = buffer.toString("base64");
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        const {
          data: { text },
        } = await worker.recognize(dataUrl);
        await worker.terminate();

        return text || "No text found in image";
      }
    } catch (error) {
      console.error("Error extracting text from image:", error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  }

  /**
   * Extract text from file buffer (for Supabase storage)
   */
  async extractTextFromBuffer(fileBuffer, mimeType, originalName) {
    try {
      // Handle images with OCR
      if (this.isImageFile(mimeType)) {
        return await this.extractTextFromImageBuffer(fileBuffer, mimeType);
      }

      const fileExtension = path.extname(originalName).toLowerCase();

      // Handle different file types
      if (fileExtension === ".pdf") {
        return await this.extractFromPDFBuffer(fileBuffer);
      } else if (fileExtension === ".docx") {
        return await this.extractFromDOCXBuffer(fileBuffer);
      } else if (fileExtension === ".txt") {
        return await this.extractFromTXTBuffer(fileBuffer);
      } else {
        // Fallback to textract for other file types
        return await this.extractWithTextractBuffer(fileBuffer, originalName);
      }
    } catch (error) {
      console.error("Error extracting text from document buffer:", error);
      throw new Error(`Failed to extract text from document: ${error.message}`);
    }
  }

  async extractFromPDFBuffer(buffer) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  async extractFromDOCXBuffer(buffer) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  async extractFromTXTBuffer(buffer) {
    return buffer.toString("utf8");
  }

  async extractWithTextractBuffer(buffer, originalName) {
    // For textract, we need to save to a temporary file
    const tempDir = require("os").tmpdir();
    const tempPath = path.join(tempDir, `temp_${Date.now()}_${originalName}`);

    try {
      fs.writeFileSync(tempPath, buffer);
      return new Promise((resolve, reject) => {
        textract.fromFileWithPath(tempPath, (error, text) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempPath);
          } catch (e) {}

          if (error) {
            reject(error);
          } else {
            resolve(text);
          }
        });
      });
    } catch (error) {
      // Clean up temp file if it exists
      try {
        fs.unlinkSync(tempPath);
      } catch (e) {}
      throw error;
    }
  }

  async extractText(filePath, mimeType) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();

      // Handle different file types
      if (fileExtension === ".pdf") {
        return await this.extractFromPDF(filePath);
      } else if (fileExtension === ".docx") {
        return await this.extractFromDOCX(filePath);
      } else if (fileExtension === ".txt") {
        return await this.extractFromTXT(filePath);
      } else {
        // Fallback to textract for other file types
        return await this.extractWithTextract(filePath);
      }
    } catch (error) {
      console.error("Error extracting text from document:", error);
      throw new Error(`Failed to extract text from document: ${error.message}`);
    }
  }

  async extractFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  async extractFromDOCX(filePath) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromTXT(filePath) {
    return fs.readFileSync(filePath, "utf8");
  }

  async extractWithTextract(filePath) {
    return new Promise((resolve, reject) => {
      textract.fromFileWithPath(filePath, (error, text) => {
        if (error) {
          reject(error);
        } else {
          resolve(text);
        }
      });
    });
  }

  async getDocumentInfo(filePath) {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath).toLowerCase();

    return {
      size: stats.size,
      extension,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }
}

module.exports = new DocumentService();
