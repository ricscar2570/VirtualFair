import boto3
import json

# Nome della tabella DynamoDB
TABLE_NAME = "StandAnalytics"

# Inizializza il client DynamoDB
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event, context):
    try:
        # Recupera la tabella DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        
        # Scansiona la tabella per trovare gli stand sponsorizzati
        response = table.scan(
            FilterExpression="is_sponsored = :sponsored",
            ExpressionAttributeValues={":sponsored": True}
        )
        
        # Ritorna gli elementi sponsorizzati
        return {
            'statusCode': 200,
            'body': json.dumps(response['Items']),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal Server Error'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
