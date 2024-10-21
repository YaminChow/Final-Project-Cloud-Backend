// index.js (the main handler for Lambda)
const login = require("./login");
const signup = require("./signup");
const uploadImage = require("./uploadImage");
const getImage = require("./getImage");

exports.handler = async (event) => {
  const path = event.path || ""; // Assuming event comes from API Gateway with a path
  const method = event.httpMethod || ""; // Assuming HTTP methods are used

  if (path === "/login" && method === "POST") {
    return await login.handler(event);
  } else if (path === "/signup" && method === "POST") {
    return await signup.handler(event);
  } else if (path === "/uploadImage" && method === "POST") {
    return await uploadImage.handler(event);
  } else if (path === "/getImage" && method === "GET") {
    return await getImage.handler(event);
  } else {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Invalid path or method" }),
    };
  }
};
