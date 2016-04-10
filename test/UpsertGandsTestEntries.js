var modPath = require("path");
var modFs = require("fs");

var __root = modPath.resolve(__dirname, "./../fabula-object-model/");
var fom = require(__root).prototype.getInstance({
	"dburl": "http://127.0.0.1:9000/db?",
	"dbname": "well.demo",
	"dbsrc": "main"
});

var db = fom.create("DBModel");

// Материалы
(function(){
	// return;
	var _insert = {
		"ТЦДК00": {
			"GSID": "ТЦДК00",
			"GSID4": "ТЦБу",
			"Tick": 0,
			"GSCOP": "877",
			"GSKindName": "*тестовый",
			"GSName": "",
			"Sort4": 60
		},
		"ТЦДК0000": {
			"GSID": "ТЦДК0000",
			"GSID4": "ТЦБу",
			"Tick": 0,
			"GSCOP": "877",
			"GSKindName": "*тестовый",
			"GSName": "*белый 350 г/м2",
			"Sort4": 60,
			"GSUnit": "лист А3",
			"GSCostSale": 40,
			"GSCost": 20
		},
		"ТЦБуМеТ0": {
			"GSID": "ТЦБуМеТ0",
			"GSID4": "ТЦБу",
			"Tick": 0,
			"GSCOP": "87",
			"GSKindName": "Бумага мелованная А3",
			"GSName": "*тестовая 130 г/м2",
			"Sort4": 60,
			"GSUnit": "лист А3",
			"GSCostSale": 3,
			"GSCost": 1.5
		},
		"ТЦБуОфТ0": {
			"GSID": "ТЦБуОфТ0",
			"GSID4": "ТЦБу",
			"Tick": 0,
			"GSCOP": "87",
			"GSKindName": "Бумага офсетная А3",
			"GSName": "*тестовая 130 г/м2",
			"Sort4": 60,
			"GSUnit": "лист А3",
			"GSCostSale": 3,
			"GSCost": 1.5
		}
	};

	db.dbquery({
		query: "SELECT GSID FROM GANDS WHERE GSID LIKE 'ТЦДК%' OR 'ТЦБу%' ",
		callback: function(dbres){
			var _add = [];
			var lnk = {};
			var c, prop;
			for(c=0; c<dbres.recs.length; c++){
				lnk[dbres.recs[c].GSID] = dbres.recs[c];
			}
			for(prop in _insert){
				if (  !_insert.hasOwnProperty(prop)  ) continue;
				if (  !lnk.hasOwnProperty(prop)  ){
					var row = _insert[prop];
					var _fields = [];
					var _values = [];
					for(var prop2 in row){
						if (  !row.hasOwnProperty(prop2)  ) continue;
						if (typeof row[prop2] == "string" && !row[prop2]){
							continue;
						}
						_fields.push("["+prop2+"]");
						_values.push(typeof row[prop2] == "string" ? '\''+ row[prop2] +'\'' : row[prop2]);
					}
					_add.push("INSERT INTO GANDS (" + _fields.join(", ") + ") VALUES (" + _values.join(", ") + ")");
				}
			}
			db.dbquery({
				query: _add.join("; "),
				callback: function(dbres){
					console.log(dbres);
				}
			});
		}
	});
})();


// Форматы
(function(){
	// return;
	var _insert = {
		"ТСПоФм": {
			"GSID": "ТСПоФм",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "",
			"Sort4": 90
		},
		"ТСПоФмА1": {
			"GSID": "ТСПоФмА1",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A1",
			"Sort4": 90
		},
		"ТСПоФмА2": {
			"GSID": "ТСПоФмА2",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A2",
			"Sort4": 90
		},
		"ТСПоФмА3": {
			"GSID": "ТСПоФмА3",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A3",
			"Sort4": 90
		},
		"ТСПоФмА4": {
			"GSID": "ТСПоФмА4",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A4",
			"Sort4": 90
		},
		"ТСПоФмА5": {
			"GSID": "ТСПоФмА5",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A5",
			"Sort4": 90
		},
		"ТСПоФмА6": {
			"GSID": "ТСПоФмА6",
			"GSID4": "ТСПо",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "Формат",
			"GSName": "A6",
			"Sort4": 90
		}
	};
	db.dbquery({
		query: "SELECT GSID FROM GANDS WHERE GSID LIKE 'ТСПо%' ",
		callback: function(dbres){
			var _add = [];
			var lnk = {};
			var c, prop;
			for(c=0; c<dbres.recs.length; c++){
				lnk[dbres.recs[c].GSID] = dbres.recs[c];
			}
			for(prop in _insert){
				if (  !_insert.hasOwnProperty(prop)  ) continue;
				if (  !lnk.hasOwnProperty(prop)  ){
					var row = _insert[prop];
					var _fields = [];
					var _values = [];
					for(var prop2 in row){
						if (  !row.hasOwnProperty(prop2)  ) continue;
						if (typeof row[prop2] == "string" && !row[prop2]){
							continue;
						}
						_fields.push("["+prop2+"]");
						_values.push(typeof row[prop2] == "string" ? '\''+ row[prop2] +'\'' : row[prop2]);
					}
					_add.push("INSERT INTO GANDS (" + _fields.join(", ") + ") VALUES (" + _values.join(", ") + ")");
				}
			}
			db.dbquery({
				query: _add.join("; "),
				callback: function(dbres){
					console.log(dbres);
				}
			});
		}
	});
})();


// Свойства
(function(){
	// return;
	var _insert = {
		"Размер_ТСПоФмА1": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА1",
			"value": "594x841"
		},
		"Размер_ТСПоФмА2": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА2",
			"value": "420x594"
		},
		"Размер_ТСПоФмА3": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА3",
			"value": "297x420"
		},
		"Размер_ТСПоФмА4": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА4",
			"value": "210x297"
		},
		"Размер_ТСПоФмА5": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА5",
			"value": "148x210"
		},
		"Размер_ТСПоФмА6": {
			"property": "Размер",
			"extclass": "GANDS",
			"extid": "ТСПоФмА6",
			"value": "105x148"
		}
	};
	db.dbquery({
		query: "SELECT property, extclass, extid FROM Property WHERE ExtClass = 'GANDS' AND property LIKE 'Размер' ",
		callback: function(dbres){
			var _add = [];
			var lnk = {};
			var c, prop;
			for(c=0; c<dbres.recs.length; c++){
				lnk[dbres.recs[c].property+"_"+dbres.recs[c].extid] = dbres.recs[c];
			}
			for(prop in _insert){
				if (  !_insert.hasOwnProperty(prop)  ) continue;
				if (  !lnk.hasOwnProperty(prop)  ){
					var row = _insert[prop];
					var _fields = [];
					var _values = [];
					for(var prop2 in row){
						if (  !row.hasOwnProperty(prop2)  ) continue;
						if (typeof row[prop2] == "string" && !row[prop2]){
							continue;
						}
						_fields.push("["+prop2+"]");
						_values.push(typeof row[prop2] == "string" ? '\''+ row[prop2] +'\'' : row[prop2]);
					}
					_add.push("INSERT INTO Property (" + _fields.join(", ") + ") VALUES (" + _values.join(", ") + ")");
				}
			}
			db.dbquery({
				query: _add.join("; "),
				callback: function(dbres){
					console.log(dbres);
				}
			});
		}
	});
})();



// Свойства gands
(function(){
	var _insert = {
		"Способ печати_ПЗРАЛПM2": {
			"property": "Способ печати",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПM2",
			"value": "Цифра"
		},
		"Цветность_ПЗРАЛПM2": {
			"property": "Цветность",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПM2",
			"value": "Полноцвет"
		},


		"Способ печати_ПЗРАЛПMI": {
			"property": "Способ печати",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПMI",
			"value": "Цифра"
		},
		"Цветность_ПЗРАЛПMI": {
			"property": "Цветность",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПMI",
			"value": "ЧБ"
		},


		"Способ печати_ПЗРАЛПРА": {
			"property": "Способ печати",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПРА",
			"value": "Офсет"
		},
		"Цветность_ПЗРАЛПРА": {
			"property": "Цветность",
			"extclass": "GANDS",
			"extid": "ПЗРАЛПРА",
			"value": "Полноцвет"
		}
	};
	db.dbquery({
		query: "SELECT property, extclass, extid FROM Property WHERE ExtClass = 'GANDS' AND extid LIKE 'ПЗРАЛП%' ",
		callback: function(dbres){
			var _add = [];
			var lnk = {};
			var c, prop;
			for(c=0; c<dbres.recs.length; c++){
				lnk[dbres.recs[c].property+"_"+dbres.recs[c].extid] = dbres.recs[c];
			}
			for(prop in _insert){
				if (  !_insert.hasOwnProperty(prop)  ) continue;
				if (  !lnk.hasOwnProperty(prop)  ){
					var row = _insert[prop];
					var _fields = [];
					var _values = [];
					for(var prop2 in row){
						if (  !row.hasOwnProperty(prop2)  ) continue;
						if (typeof row[prop2] == "string" && !row[prop2]){
							continue;
						}
						_fields.push("["+prop2+"]");
						_values.push(typeof row[prop2] == "string" ? '\''+ row[prop2] +'\'' : row[prop2]);
					}
					_add.push("INSERT INTO Property (" + _fields.join(", ") + ") VALUES (" + _values.join(", ") + ")");
				}
			}
			db.dbquery({
				query: _add.join("; "),
				callback: function(dbres){
					console.log(dbres);
				}
			});
		}
	});
})();

/*
db.dbquery({
	query: "SELECT * FROM GANDS WHERE GSID LIKE 'ТСПо%' ",
	callback: (dbres)=>{
		console.log(dbres);
		if (dbres.info.errors.length){
			modFs.writeFile("./formats", JSON.stringify(dbres.info.errors), ()=>{
				console.log("file.formats.err");
			});
			return;
		}
		modFs.writeFile("./formats", JSON.stringify(dbres.recs), ()=>{
			console.log("file.formats.written");
		});
	}
});
*/

