const {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
} = require("@aws-sdk/client-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const bcrypt = require("bcryptjs");

// Initialize AWS services
const s3 = new S3Client({ region: "us-east-1" });
const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

const BUCKET_NAME = process.env.BUCKET_NAME;
const DYNAMODB_TABLE_NAME = process.env.TABLE_NAME;
exports.handler = async (event) => {
  try {
    const { email, password, name, image } = JSON.parse(event.body);

    // Step 1: Check if the email already exists in DynamoDB
    const checkParams = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: {
        email: { S: email },
      },
    };

    const existingUser = await dynamoDB.send(new GetItemCommand(checkParams));

    if (existingUser.Item) {
      // If the email exists, return an error message
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({
          message: "Email already exists. Please use a different email.",
        }),
      };
    }

    // Step 2: Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Step 3: Generate pre-signed URL for uploading the image
    const filename = `${email}-profile.jpg`; // Example: email-based image name
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: filename,
      ContentType: image.contentType, // Content type of the image (e.g., image/jpeg)
    };
    const command = new PutObjectCommand(uploadParams);
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 60 });

    // Step 4: Store user data in DynamoDB with image URL
    const imageUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${filename}`;
    const timestamp = new Date().toISOString();

    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        email: { S: email }, // Primary key
        password: { S: hashedPassword },
        name: { S: name },
        profileImage: { S: imageUrl },
        created_at: { S: timestamp },
      },
    };

    await dynamoDB.send(new PutItemCommand(params));

    // Return success response with upload URL for the client to upload the image
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({
        message: "User signed up successfully",
        uploadURL, // Return the pre-signed URL to the client for image upload
      }),
    };
  } catch (error) {
    console.error("Error during sign-up:", error);
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
