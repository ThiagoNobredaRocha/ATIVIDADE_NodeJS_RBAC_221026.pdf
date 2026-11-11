const Subscription = require('../models/subscriptionModel');
const Certificate = require('../models/certificateModel');
const AppError = require('../utils/AppError');
const { ROLES } = require('../middlewares/rbacMiddleware');

function formatDate(value) {
  return new Date(value).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function renderText(cert) {
  return [
    '==============================================',
    '            CERTIFICADO DE PARTICIPAÇÃO',
    '==============================================',
    '',
    `Certificamos que ${cert.user_name} participou do evento`,
    `"${cert.event_title}", realizado em ${formatDate(cert.event_date)}`,
    cert.event_location ? `no local: ${cert.event_location}.` : '',
    '',
    `Código de verificação: ${cert.code}`,
    `Emitido em: ${formatDate(cert.issued_at)}`,
    '',
  ].join('\n');
}

const certificateController = {
  /**
   * GET /certificates/:id — :id é o ID da INSCRIÇÃO.
   * ADMIN e EDITOR: qualquer inscrição. USER: apenas das suas inscrições.
   * ?format=txt baixa o certificado como arquivo texto.
   */
  async getBySubscription(req, res) {
    const subscriptionId = Number(req.params.id);

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) throw new AppError('Inscrição não encontrada.', 404);

    if (req.user.role === ROLES.USER && subscription.user_id !== req.user.id) {
      throw new AppError('Acesso negado. Você só pode emitir certificados das suas próprias inscrições.', 403);
    }

    const cert = await Certificate.issueForSubscription(subscriptionId);

    if (req.query.format === 'txt') {
      res.set('Content-Type', 'text/plain; charset=utf-8');
      res.set('Content-Disposition', `attachment; filename="certificado-${cert.code}.txt"`);
      return res.send(renderText(cert));
    }

    return res.json({
      message: 'Certificado emitido com sucesso!',
      certificate: {
        id: cert.id,
        code: cert.code,
        subscription_id: cert.subscription_id,
        participante: cert.user_name,
        email: cert.user_email,
        evento: cert.event_title,
        dataEvento: cert.event_date,
        local: cert.event_location,
        emitidoEm: cert.issued_at,
      },
    });
  },
};

module.exports = certificateController;
