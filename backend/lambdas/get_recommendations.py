import boto3
import json

# Configurazione Amazon Personalize
personalize_runtime = boto3.client('personalize-runtime')

# ARN della campagna Personalize
RECOMMENDER_ARN = 'arn:aws:personalize:region:account-id:campaign/campaign-name'

def lambda_handler(event, context):
    try:
        # Ottieni l'ID utente dai parametri della richiesta
        user_id = event['queryStringParameters']['user_id']
        
        # Richiedi le raccomandazioni da Amazon Personalize
        response = personalize_runtime.get_recommendations(
            campaignArn=RECOMMENDER_ARN,
            userId=user_id
        )
        
        # Prepara la lista di raccomandazioni
        recommendations = [{"itemId": item["itemId"]} for item in response["itemList"]]
        
        # Restituisci il risultato
        return {
            'statusCode': 200,
            'body': json.dumps(recommendations),
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
