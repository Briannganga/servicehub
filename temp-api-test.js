const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
(async () => {
  const token = jwt.sign({id:1,email:'john@example.com',role:'client'}, 'supersecurekey', {expiresIn:'7d'});
  console.log('token', token);
  const res = await fetch('http://localhost:5000/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ title: 'Sensor', description: 'desc', price: 1200, category: 'Technology' })
  });
  console.log('status', res.status);
  try { console.log('body', await res.json()); } catch (e) { console.log('body text', await res.text()); }
})();