const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");
const bcrypt = require("bcryptjs");

// Initialize DynamoDB client
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
const DYNAMODB_TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);

    // Retrieve user data from DynamoDB
    const user = await dynamoDB.send(
      new GetItemCommand({
        TableName: DYNAMODB_TABLE_NAME,
        Key: { email: { S: email } },
      })
    );

    if (!user.Item) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Compare the password with the stored hashed password
    const validPassword = await bcrypt.compare(password, user.Item.password.S);
    if (!validPassword) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: "Invalid credentials" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ message: "Login successful" }),
    };
  } catch (error) {
    console.error("Error during login:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
