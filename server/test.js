import bcrypt from 'bcrypt';

const newHash = await bcrypt.hash("Fola@2222", 10);
console.log("New hash:", newHash);