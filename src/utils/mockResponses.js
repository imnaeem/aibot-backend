/**
 * Generate contextual mock responses based on user input
 */
const getMockResponse = (message) => {
  const mockResponses = [
    "⚠️ **API Key Required**: To get real AI responses, please add your Groq API key to the `.env` file.\n\n",
    "Here's how to set it up:\n\n",
    "1. Get a free API key from [Groq Console](https://console.groq.com)\n",
    "2. Create a `.env` file in the backend directory\n",
    "3. Add: `GROQ_API_KEY=your_key_here`\n\n",
    "**Sample code example:**\n\n",
    "```javascript\n",
    "// JavaScript example\n",
    "function greet(name) {\n",
    "  return `Hello, ${name}!`;\n",
    "}\n",
    "\n",
    "console.log(greet('World'));\n",
    "```\n\n",
    "```python\n",
    "# Python example\n",
    "def calculate_fibonacci(n):\n",
    "    if n <= 1:\n",
    "        return n\n",
    "    return calculate_fibonacci(n-1) + calculate_fibonacci(n-2)\n",
    "\n",
    "print(calculate_fibonacci(10))\n",
    "```\n\n",
    "For now, you're seeing this mock response. The UI features like search, favorites, and `inline code` highlighting are all working!\n\n",
    "Questions about: **" + message + "**",
  ];

  // Select response based on message hash for consistency
  const responseIndex =
    Math.abs(message.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) %
    mockResponses.length;

  let response = mockResponses[responseIndex];

  // Add contextual content based on message content
  if (
    message.toLowerCase().includes("code") ||
    message.toLowerCase().includes("programming") ||
    message.toLowerCase().includes("function")
  ) {
    response += getCodeExample();
  } else if (
    message.toLowerCase().includes("explain") ||
    message.toLowerCase().includes("how")
  ) {
    response += getExplanationContent();
  } else if (
    message.toLowerCase().includes("list") ||
    message.toLowerCase().includes("steps")
  ) {
    response += getListContent();
  }

  return response;
};

/**
 * Generate code example content
 */
const getCodeExample = () => {
  return `\n\n\`\`\`javascript
// Example code snippet
function example() {
  console.log('This is a sample function!');
  return 'Hello World';
}

example();
\`\`\`

This demonstrates the concept we discussed with practical implementation.`;
};

/**
 * Generate explanation content
 */
const getExplanationContent = () => {
  return `\n\n**Detailed Explanation:**

1. **First Point**: This covers the basic concept
2. **Second Point**: Here we dive deeper into the mechanics  
3. **Third Point**: Finally, we look at practical applications

This step-by-step breakdown should help clarify the topic for you.`;
};

/**
 * Generate list content
 */
const getListContent = () => {
  return `\n\n**Here's a comprehensive list:**

• **Item 1**: Important first consideration
• **Item 2**: Key second element
• **Item 3**: Critical third factor
• **Item 4**: Essential fourth component

Each of these points contributes to the overall understanding.`;
};

/**
 * Generate random helpful tip
 */
const getRandomTip = () => {
  const tips = [
    "💡 **Tip**: Use proper markdown formatting for better readability!",
    "🚀 **Tip**: The streaming feature makes conversations feel more natural.",
    "⭐ **Tip**: Try the favorites feature to save important chats.",
    "🔍 **Tip**: Use the search functionality to find previous conversations.",
  ];

  return tips[Math.floor(Math.random() * tips.length)];
};

module.exports = {
  getMockResponse,
  getCodeExample,
  getExplanationContent,
  getListContent,
  getRandomTip,
};
