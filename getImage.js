// getImage.js
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  const dynamoDB = new DynamoDBClient({ region: "us-east-1" });
  const TABLE_NAME = process.env.TABLE_NAME;

  // Extract email from query parameters
  const { email } = event.queryStringParameters;

  // Check if the email parameter is provided
  if (!email) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Email parameter is missing" }),
    };
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        email: { S: email },
      },
    };

    // Query DynamoDB
    const data = await dynamoDB.send(new GetItemCommand(params));

    if (!data.Item) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ message: "Profile not found" }),
      };
    }

    // Return the profile data
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        email: data.Item.email.S,
        name: data.Item.name.S,
        profileImage: data.Item.profileImage ? data.Item.profileImage.S : null,
      }),
    };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
