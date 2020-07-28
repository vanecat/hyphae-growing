/*****************************************************
 * If you don't see anything, then just wait a while.
 *****************************************************/

function HyphaeGrowing() {
    var hypaeColor = color(250, 250, 250, 1000);
//var hypaeColor = color(255, 0, 0);
    stroke(hypaeColor);

// Probability of a turn
    var pTurn = 0.005;

// Probability of a split
    var pSplit = 0.01;

// Speed of growth
    var speed = 0.05;

    var running = true;

// Point at which the hyphae grows
    var Growth = function(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;

        this.newCurve = function() {
            this.curve = (random() * 0.4 + 0.1);
            if (random < 0.5) {
                this.curve *= -1;
            }
        };
        this.newCurve();

        this.update = function() {
            this.angle += this.curve;

            if (random() < pTurn) {
                this.newCurve();
            }

            var x = this.x + speed * cos(this.angle);
            var y = this.y + speed * sin(this.angle);

            if (this.x > 0 && this.x <= 400 &&
                this.y > 0 && this.y <= 400) {
                line(x, y, this.x, this.y);
            }

            this.x = x;
            this.y = y;
        };

    };

    const growingPoints = [new Growth(50, 250, -45)];

    var draw = function() {
        if (running) {
            for (var g in growingPoints) {
                var p = growingPoints[g];
                p.update();
                if (random() < pSplit) {
                    // Create a new growing point and split the line
                    var newPoint = new Growth(p.x, p.y, p.angle + 45);
                    newPoint.curve = -p.curve;
                    growingPoints.push(newPoint);
                    p.angle -= 45;
                }
            }

            while (random() < (growingPoints.length - 5) / 2000) {
                // Pick a random point
                var n = random(growingPoints.length);
                growingPoints.splice(n, 1);
            }
        }
        fill(0);
        rect(2, 2, 50, 20);
        fill(160);
        text(growingPoints.length, 5, 16);
    };

// Spacebar toggles animation
    const keyPressed = function() {
        if (keyCode === 32) { running = !running; }
    };
}
