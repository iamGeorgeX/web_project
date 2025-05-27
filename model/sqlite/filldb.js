import Database from 'better-sqlite3';
import fs from 'fs';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';



const db = new Database('model/db.sqlite');

db.pragma('foreign_keys = ON');



function readImageAsBlob(filePath) {
    try {
        return fs.readFileSync(filePath); // Read the file as binary data
    } catch (err) {

        return null; // Return null if the file cannot be read
    }
}

var space_types_name=['Αμφιθέατρο','Aνοιχτό Θέατρο','Theater','Στάδιο','Indoor Stadium','Concert Hall','Cinema'];
for (let i = 0; i < space_types_name.length; i++) {
    let stmt = db.prepare(`INSERT OR IGNORE INTO space_types (name) VALUES (?)`);
    stmt.run(space_types_name[i]);
}


var spaceid=[1,2,3,4,5,6,7,8,9,10,11];
var spacename=['ΠΤΙ ΠΑΛΑΙ','Θέατρο Βράχων','Στάδιο Καλαμαρίας','Θέατρο Αλίκης','Allianz Arena','Καλλιμάρμαρο','ΟΑΚΑ','Παγκρήτιο','Τάλος','Veso Mare','Τεχνόπολις'];
var spacelocation=['Αθήνα','Αθήνα','Καλαμαριά','Πάτρα','Μόναχο','Αθήνα','Αθήνα','Ηράκλειο Κρήτης','Ηράκλειο Κρήτης','Πάτρα','Αμμουδάρα'];
var spaceparking=[1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0];
var spacetype=['Theater','Open Air Theater','Stadium','Theater','Stadium','Open Air Theater','Indoor Stadium','Concert Hall','Cinema','Cinema','Cinema'];
var spacecharacteristics=[300,200,400,250,50000,40000,70000,50000,300,200,100];


for (let i = 0; i < spaceid.length; i++) {
    let stmt = db.prepare(`INSERT OR IGNORE INTO spaces (id, location, name, parking, characteristics, type_name) VALUES (?, ?, ?, ?, ?, ?)`);
    stmt.run(spaceid[i], spacelocation[i], spacename[i], spaceparking[i], spacecharacteristics[i], space_types_name[i]);
}



var zonename=['ZoneA','ZoneB','ZoneC','ZoneD'];
var zoneupperleftx=[1,1,5,8];
var zoneupperlefty=[1,11,11,11];
var zonedownrightx=[10,5,8,10];
var zonedownrighty=[10,15,15,15];

for (let j=0;j<spaceid.length;j++){
    for (let i=0;i<zonename.length;i++){
        let stmt = db.prepare(`INSERT OR IGNORE INTO zones (name,upper_left_y,upper_left_x,down_right_x,down_right_y,space_id) VALUES (?,?,?,?,?,?)`);
        stmt.run(zonename[i],zoneupperlefty[i],zoneupperleftx[i],zonedownrightx[i],zonedownrighty[i],spaceid[j]);
    }
}
for (let i=0;i<zonename.length;i++){
    let stmt = db.prepare(`INSERT OR IGNORE INTO zones (name,upper_left_y,upper_left_x,down_right_x,down_right_y,space_id) VALUES (?,?,?,?,?,?)`);
    stmt.run(zonename[i],zoneupperlefty[i],zoneupperleftx[i],zonedownrightx[i],zonedownrighty[i],spaceid[i]);
}



