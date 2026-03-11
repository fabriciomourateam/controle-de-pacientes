import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/lib/admin-service.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/await supabase/g, 'await supabaseService');
content = content.replace(/await \(supabase/g, 'await (supabaseService');

fs.writeFileSync(filePath, content);
console.log('admin-service.ts updated successfully!');
