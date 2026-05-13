require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const payment = new Payment(client);

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend funcionando!' });
});

app.post('/api/create-pix', async (req, res) => {
    try {
        const { nome, telefone, email, genero, energia, referencia, descricao } = req.body;

        if (!nome || !email || !descricao) {
            return res.status(400).json({ error: 'Nome, email e descrição são obrigatórios' });
        }

        const amount = 299;

        const paymentData = {
            transaction_amount: amount,
            description: `Música Personalizada - ${nome}`,
            payment_method_id: "pix",
            payer: {
                email: email,
                first_name: nome.split(' ')[0],
                last_name: nome.split(' ').slice(1).join(' ') || 'Cliente'
            },
            external_reference: `MU-${Date.now()}`,
            metadata: { nome, telefone, genero, energia, referencia: referencia || 'Nenhuma', descricao }
        };

        const result = await payment.create({ body: paymentData });

        res.json({
            success: true,
            payment_id: result.id,
            qr_code_base64: result.point_of_interaction?.transaction_data?.qr_code_base64,
            external_reference: paymentData.external_reference
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar PIX' });
    }
});

app.get('/api/payment-status/:id', async (req, res) => {
    const result = await payment.get({ id: req.params.id });
    res.json({ status: result.status });
});

app.listen(PORT, () => console.log('Backend rodando!'));
