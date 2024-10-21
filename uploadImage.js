const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  DynamoDBClient,
  UpdateItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = new S3Client();
const dynamoDB = new DynamoDBClient();
const BUCKET_NAME = process.env.BUCKET_NAME; // Set the bucket name as an environment variable
const TABLE_NAME = process.env.TABLE_NAME; // Set the DynamoDB table name as an environment variable

exports.handler = async (event) => {
  try {
    // Parse the input
    const { email, filename, contentType } = JSON.parse(event.body);

    // Create the S3 key for the image (e.g., "user@example.com/profile.jpg")
    const s3Key = `${email}/profile/${filename}`;

    // Generate the S3 pre-signed URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 300 }); // URL expires in 5 minutes

    // Construct the image URL
    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`;

    // Save or update the image URL in DynamoDB for the user
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        email: { S: email }, // Primary key: the user's email
      },
      UpdateExpression: "SET profileImage = :imageUrl",
      ExpressionAttributeValues: {
        ":imageUrl": { S: imageUrl }, // Store the new image URL
      },
    };

    await dynamoDB.send(new UpdateItemCommand(updateParams));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ uploadURL, imageUrl }), // Return the pre-signed URL and image URL
    };
  } catch (error) {
    console.error("Error:", error);
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
