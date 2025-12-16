const mysql = require('mysql2/promise');

async function checkAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shivam@123',
    database: 'days365',
  });

  console.log('Checking admin users...\n');
  
  const [rows] = await connection.execute(
    'SELECT id, name, email, isAdmin FROM users WHERE isAdmin = 1 LIMIT 5'
  );
  
  console.log('Admin users found:', rows.length);
  rows.forEach(user => {
    console.log(`- ${user.name} (${user.email}): isAdmin = ${user.isAdmin}`);
  });
  
  await connection.end();
}

checkAdmin().catch(console.error);
