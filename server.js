require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
const PORT = process.env.PORT || 3000;

const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN 
});

const preference = new Preference(client);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend funcionando!' });
});

// NOVO ENDPOINT - Cria Checkout do Mercado Pago
app.post('/api/create-preference', async (req, res) => {
    try {
        const { nome, telefone, email, genero, energia, referencia, descricao } = req.body;

        if (!nome || !email || !descricao) {
            return res.status(400).json({ error: 'Nome, email e descrição são obrigatórios' });
        }

        const preferenceData = {
            items: [{
                title: `Música Personalizada - ${nome}`,
                quantity: 1,
                unit_price: 299,
                currency_id: "BRL"
            }],
            payer: {
                name: nome,
                email: email
            },
            back_urls: {
                success: "https://suascoisas.com.br/music/sucesso",
                failure: "https://suascoisas.com.br/music/erro",
                pending: "https://suascoisas.com.br/music/pendente"
            },
            auto_return: "approved",
            external_reference: `MU-${Date.now()}`,
            metadata: {
                nome,
                telefone,
                email,
                genero,
                energia,
                referencia: referencia || 'Nenhuma',
                descricao
            }
        };

        const result = await preference.create({ body: preferenceData });

        res.json({
            success: true,
            init_point: result.init_point,           // URL do Checkout
            preference_id: result.id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar checkout' });
    }
});

app.listen(PORT, () => console.log('Backend rodando na porta ' + PORT));
