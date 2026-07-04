require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db');
const { setContact, getContact } = require('../services/userContactService');
const Conversation = require('../models/Conversation');

const CONV_ID = '0a8fe4a9-ca6a-41f6-a9ec-4cac6bda79e1';

async function run() {
  const cp = await db.query(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = $1 LIMIT 1',
    [CONV_ID]
  );
  const userId = cp.rows[0]?.user_id;
  if (!userId) {
    console.log('No participant found');
    return;
  }

  await setContact(userId, { phone: '+237670000001', whatsappOptIn: true });
  const contact = await getContact(userId);
  console.log('contact saved:', contact);

  const participants = await Conversation.getParticipants(CONV_ID);
  const withPhone = participants.find((p) => String(p.user_id) === String(userId));
  console.log('participant phone:', withPhone?.phone, 'opt-in:', withPhone?.whatsapp_opt_in);
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
  });
