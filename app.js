var twophase = require('./lib/index');

console.log("Initiating algorithm...");
twophase.initialize(function () {
	console.log("Ready");
	twophase.solve("DDDDUUDUUBLFRRRLBLBRRFFFRFFDDUUDDUUURRLLLLFFFLLBBBBBBR", 30, 60, false, 
        function (err, solution) {		
				if (err) console.error(err);
				console.log("Solution:", solution);
				twophase.close();
	});
});
