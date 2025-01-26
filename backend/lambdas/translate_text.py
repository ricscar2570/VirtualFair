import boto3
import json

# Inizializza il client Amazon Translate
translate = boto3.client('translate')

def lambda_handler(event, context):
    try:
        # Legge il corpo della richiesta
        body = json.loads(event['body'])
        text = body.get('text')  # Testo da tradurre
        target_language = body.get('target_language')  # Lingua di destinazione
        
        # Validazione dei parametri
        if not text or not target_language:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing required parameters: text or target_language'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        # Richiesta di traduzione ad Amazon Translate
        response = translate.translate_text(
            Text=text,
            SourceLanguageCode='auto',  # Rileva automaticamente la lingua di origine
            TargetLanguageCode=target_language
        )
        
        # Restituisce il testo tradotto
        return {
            'statusCode': 200,
            'body': json.dumps({'translated_text': response['TranslatedText']}),
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
