import boto3
import json

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = "Feedback"

def lambda_handler(event, context):
    body = json.loads(event['body'])
    feedback = body.get('feedback')

    if not feedback:
        return {"statusCode": 400, "body": "Feedback is required"}
    
    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item={"feedback_id": "unique-id", "feedback": feedback})

    return {"statusCode": 200, "body": "Feedback saved successfully"}
