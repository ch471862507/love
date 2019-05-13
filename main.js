var express = require("express");
var app = express();
var db = require("./dbconfig");
var bodyParser = require("body-parser");
var crypto = require("crypto");

function md5(text) {
	return crypto
		.createHash("md5")
		.update(text)
		.digest("hex");
}

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(
	bodyParser.urlencoded({
		extended: false
	})
);

app.get(["/", "/index.html"], function(req, res) {
	res.render("index.ejs", {
		json: "undefined"
	});
});

app.get(["/set", "/set.html"], function(req, res) {
	res.render("set.ejs");
});

/**
 * 添加URL
 */
app.post("/set", function(req, res) {
	console.log("收到字符串", unescape(req.body.json));
	var json = JSON.stringify(req.body.json.replace(/\"/g, '\\"'));
	var md5str = md5(json);
	db.query(
		"SELECT `id`,`md5` FROM `id` WHERE md5 = '" + md5str + "'",
		function(err, rows) {
			if (err) {
				console.log(err);
				res.send(err);
			} else {
				if (rows[0] !== undefined) {
					if (md5str == rows[0].md5) {
						console.log("重复记录", rows[0].md5);
						res.send("/id/" + rows[0].id);
					}
				} else {
					db.query(
						"insert into id(json,md5) values('" +
							json +
							"','" +
							md5(json) +
							"')",
						function(err, rows) {
							if (err) {
								console.error(err);
								res.send(err);
							} else {
								res.send("/id/" + rows.insertId);
							}
						}
					);
				}
			}
		}
	);
});

app.get("/id/:id", function(req, res) {
	var id = Number(req.params.id);
	if (isNaN(id)) {
		console.log(id);
		var code = 500;
		res.status(code).render("error.ejs", {
			error: "参数错误",
			code: code
		});
	} else {
		console.log(id);
		db.query("SELECT json FROM `id` WHERE id=" + id + "", function(
			err,
			rows
		) {
			if (err) {
				console.log(err);
				var code = 500;
				res.status(code).render("error.ejs", {
					error: "数据库错误",
					code: code
				});
			} else {
				if (rows[0] !== undefined) {
					console.log("找到记录", rows[0].json);
					res.render("index.ejs", {
						json: rows[0].json
					});
				} else {
					var code = 404;
					res.status(code).render("error.ejs", {
						error: "未找到记录",
						code: code
					});
				}
			}
		});
	}
});

app.use(function(req, res, next) {
	var code = 404;
	res.status(code).render("error.ejs", {
		error: "未定义页面",
		code: code
	});
});

app.use(function(err, req, res, next) {
	console.error(err.stack);
	var code = 500;
	res.status(code).render("error.ejs", {
		error: "为止错误",
		code: code
	});
});

app.listen(3000);
