/*****************************************************
 * If you don't see anything, then just wait a while.
 *****************************************************/

function HyphaeGrowing(width, height, parentEl=false) {
    const logEl = document.getElementById('log');

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    parentEl = !parentEl ? document.body : parentEl;

    parentEl.appendChild(c);
    const ctx = c.getContext("2d");


    let isRunning = true;

    const line = (x1, y1, x0,y0) => {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    };

    const isWithinBounds = (x,y) => {
        return x >= 0 && x < width && y >= 0 && y < height;
    };


    const pBranchOff = 0.5; // Probability of a new branch forming at tip
    const growthLength = 20; // length of growth in pixels
    const growthLengthIncrement = 5; // length of growth in pixels
    const growthInterval = 100; // Speed of growth
    const angleDeltaRange = 180, branchMaxCount = 2, branchGrowthMaxAttempts = 20;
    const pixelPrecision = 100;

    // Point at which the hyphae grows
    const growthMatrix = {};
    const Growth = (x=width/2, y=height/2, angle=null) => {
        if (angle === null) {
            // initial angle is random
            angle = Math.floor(Math.random() * 360);
        }

        const potentialBranchCount = Math.ceil(Math.random() * branchMaxCount);
        let attemptedBranchCount = 0;

        const grow = () => {

            let x1 = x, y1 = y, newAngle = 0;

            // attempts (i times)
            let hasGrownBranch = false;
            for(let ai = 0; ai < potentialBranchCount; ai++) {
                // the new angle should add be [-angleDelta/2, +angleDelta/2]
                newAngle = angle + (-1 * (angleDeltaRange/2)) + Math.random() * angleDeltaRange;

                for(let i = growthLengthIncrement; i <= growthLength; i+=growthLengthIncrement) {
                    x1 = Math.ceil( pixelPrecision * (x + i * Math.cos(newAngle)) ) / pixelPrecision;
                    y1 = Math.ceil( pixelPrecision * (y + i * Math.sin(newAngle)) ) / pixelPrecision;

                    if (growthMatrix[x1+'_'+y1] || !isWithinBounds(x1, y1)) {
                        // no growth (bumped into other branch/frame edge on 1st try)
                        if (i === 1) {
                            //console.log('hit other growth too soon');
                            break;
                        }
                        // growth possibly up to here only (bumped into another branch/frame edge after 1st try)
                        else {
                            //console.log('grew, but not all the way');
                            hasGrownBranch = true;
                            break;
                        }
                    } else {
                        hasGrownBranch = true;
                        growthMatrix[x1+'_'+y1] = true;
                    }
                }
                if (hasGrownBranch) {
                    break;
                }
            }
            attemptedBranchCount++;

            if (hasGrownBranch) {
                line(x1, y1, x, y);
                if (Math.random() < pBranchOff) {
                    // Create a new growing point from tip of branch and current angle
                    return Growth(x1, y1, newAngle);
                }
            }

            return false;
        };

        return {
            grow,
            isDoneGrowing: () => { return (attemptedBranchCount >= potentialBranchCount); }
        }
    };

    const growingBranches = [Growth()];

    let deadBranchesCount = 0;
    const draw = () => {
        if (!isRunning) {
            return;
        }
        const newBranches = [];
        const deadBranches = [];
        for (let i in growingBranches) {
            const newBranch = growingBranches[i].grow();
            if (newBranch) {
                newBranches.push(newBranch);
            }

            if (growingBranches[i].isDoneGrowing()) {
                deadBranches.push(i);
            }
        }
        deadBranchesCount += deadBranches.length;
        deadBranches.reverse();
        for (let i of deadBranches) {
            growingBranches.splice(i,1);
        }
        for (let branch of newBranches) {
            growingBranches.push(branch);
        }

        isRunning = growingBranches.length > 0;

        logEl.innerHTML = `${isRunning ? 'is':'NOT'} running :: growing branches: ${growingBranches.length}, dead branches: ${deadBranchesCount}, matrix: ${Object.keys(growthMatrix).length}`;

        setTimeout(draw, growthInterval);


    };

    // Spacebar toggles animation
    document.body.addEventListener('keypress', (e) => {
        if (e.keyCode === 32) {
            isRunning = !isRunning;
            if (isRunning) {
                draw();
            }
        }
    });
}
