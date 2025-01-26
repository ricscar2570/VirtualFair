import stripe
import json
import os

# Configura la chiave API di Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

def lambda_handler(event, context):
    try:
        # Legge il corpo della richiesta
        body = json.loads(event['body'])
        
        # Estrae i parametri dal corpo della richiesta
        amount = body.get('amount')  # Importo in centesimi (es. 500 = $5.00)
        currency = body.get('currency', 'usd')  # Valuta, di default USD
        source = body.get('source')  # Sorgente di pagamento (es. token Stripe)

        # Validazione dei parametri
        if not amount or not source:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Missing required parameters: amount or source'}),
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        
        # Crea un addebito utilizzando Stripe
        charge = stripe.Charge.create(
            amount=amount,
            currency=currency,
            source=source,
            description="VirtualFair Payment"
        )

        # Ritorna il successo del pagamento
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Payment successful', 'charge': charge}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except stripe.error.CardError as e:
        # Gestione errori legati alla carta
        return {
            'statusCode': 400,
            'body': json.dumps({'message': 'Card error', 'error': str(e)}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
    except Exception as e:
        # Gestione errori generici
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Internal Server Error'}),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
