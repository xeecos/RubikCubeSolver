var twophase = require('./lib/index');

console.log("Initiating algorithm...");
twophase.initialize(function () {
    console.log("Ready");

    // This just tests the solve, solution is F
    twophase.solve("UUUUUURRRDRRDRRDRRFFFFFFFFFLLLDDDDDDLLULLULLUBBBBBBBBB", 30, 60, false, function (err, solution) {
        if (err) console.error(err);

        twophase.randomCube(function (err, randomCube) {
            if (err) console.error(err);
            var cube = randomCube;
            //cube = "DUDLUDLFDRBRFRBLUUBUBLFRLDFFFUDDBRDRBFUBLUULDFRLRBLBRF";
            console.log(cube);

            twophase.solve(cube, 30, 60, false, function (err, solution) {
                if (err) console.error(err);
                console.log("Solution:", solution);
                twophase.close();
            });
        });

    });
});