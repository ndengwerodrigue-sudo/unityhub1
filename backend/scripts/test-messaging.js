require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const db = require('../db');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const CONV_ID = '0a8fe4a9-ca6a-41f6-a9ec-4cac6bda79e1';

async function run() {
  const cp = await db.query(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = $1 LIMIT 1',
    [CONV_ID]
  );
  const uid = cp.rows[0]?.user_id;
  if (!uid) {
    console.log('No participants for conversation');
    process.exit(0);
  }
  const participants = await Conversation.getParticipants(CONV_ID);
  console.log('participants:', participants.length);
  const messages = await Message.findByConversation(CONV_ID, uid);
  console.log('messages:', messages.messages.length);
  const conv = await Conversation.findById(CONV_ID, uid);
  console.log('conversation:', conv ? 'found' : 'not found');
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
  });
