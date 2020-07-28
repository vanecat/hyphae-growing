/*****************************************************
 * If you don't see anything, then just wait a while.
 *****************************************************/

function HyphaeGrowing(width, height, parentEl=false) {
    const logEl = document.getElementById('log');

    let isRunning = false;
    let runningInterval = null;

    const c = document.createElement('canvas');
    c.width = width;
    c.height = height;
    parentEl = !parentEl ? document.body : parentEl;

    parentEl.appendChild(c);
    const ctx = c.getContext("2d");

    const line = (x1, y1, x0,y0) => {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
    };

    const isWithinBounds = (x,y) => {
        return x >= 0 && x < width && y >= 0 && y < height;
    };


    const pBranchOff = 0.3; // Probability of a new branch forming at tip
    const pBranchRandomDeath = 0.0; // Probability of a branch spontaneously stopping growing
    const growthLengthMin = 2; // length of growth in pixels
    const growthLengthMax = 4; // length of growth in pixels
    const growthLengthIncrement = 2; // length of growth in pixels
    const allowBranchOverlap = false;
    const growthInterval = 10; // Speed of growth
    const angleDeltaRange = 25, branchMaxCount = 4, branchGrowthMaxAttempts = 10;
    const pixelPrecision = 1;

    // Point at which the hyphae grows
    const growthMatrix = {};
    const isPointOccupied = (x,y) => {
        return growthMatrix[x+'_'+y];
    };
    const nearbyRadius = 1;
    const arePointsNearbyOccupied = (x,y, x0, y0) => {
        let isOccupied = false;
        for(let xi=-1; xi<=1; xi++) {
            for(let yi=-1; yi<=1; yi++) {
                if (xi + x === x0 && yi + y === y0) {
                    continue;
                }
                if (isPointOccupied(xi + x, yi + y)) {
                    return true;
                }
            }
        }
        return false;
    };
    const Growth = (x=width/2, y=height/2, angle=null, growthCyclesWithoutBranching=0) => {
        if (angle === null) {
            // initial angle is random
            angle = Math.floor(Math.random() * 360);
        }

        let potentialBranchCount = Math.ceil(Math.random() * branchMaxCount);
        let attemptedBranchCount = 0;

        const grow = () => {

            let x1 = x, y1 = y, newAngle = 0;

            // attempts (i times)
            let hasGrownBranch = false;
            for(let ai = 0; ai < (allowBranchOverlap ? 1 : branchGrowthMaxAttempts); ai++) {
                // the new angle should add be [-angleDelta/2, +angleDelta/2]
                newAngle = angle + (-1 * (angleDeltaRange/2)) + Math.random() * angleDeltaRange;

                const growthLength = growthLengthMin + Math.ceil(Math.random() * growthLengthMax);
                if (allowBranchOverlap) {
                    x1 = Math.ceil( pixelPrecision * (x + growthLength * Math.cos(newAngle)) ) / pixelPrecision;
                    y1 = Math.ceil( pixelPrecision * (y + growthLength * Math.sin(newAngle)) ) / pixelPrecision;
                    hasGrownBranch = isWithinBounds(x1, y1);
                } else {
                    let isFirstGrowthIncrement = true;
                    for(let i = growthLengthIncrement; i <= growthLength; i+=growthLengthIncrement) {
                        x1 = Math.ceil( pixelPrecision * (x + i * Math.cos(newAngle)) ) / pixelPrecision;
                        y1 = Math.ceil( pixelPrecision * (y + i * Math.sin(newAngle)) ) / pixelPrecision;

                        if (arePointsNearbyOccupied(x1,y1, x,y) || !isWithinBounds(x1, y1)) {
                            // no growth (bumped into other branch/frame edge on 1st try)
                            if (isFirstGrowthIncrement) {
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
                        isFirstGrowthIncrement = false;
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
                } else {
                    potentialBranchCount = Math.ceil(Math.random() * branchMaxCount);
                    attemptedBranchCount = 0;
                    growthCyclesWithoutBranching++;
                    x = x1;
                    y = y1;
                }
            }

            return false;
        };

        return {
            grow,
            isDoneGrowing: () => {
                return (attemptedBranchCount >= potentialBranchCount) || Math.random() < (growthCyclesWithoutBranching * pBranchRandomDeath);
            }
        }
    };

    const growingBranches = [Growth()];

    let deadBranchesCount = 0;

    const draw = () => {
        const newBranches = [];
        const deadBranches = [];

        const actuallyGrowingBranches = {};
        const growingBranchesCount = growingBranches.length;
        if (growingBranchesCount > 1000) {
            // get half of the growning branches indeces, up to 1000 max
            const maxRandIndeces = Math.min(500,growingBranchesCount/2);
            for(let i=0; i<maxRandIndeces; i++) {
                const randIndex = Math.floor(Math.random() * growingBranchesCount);
                actuallyGrowingBranches[randIndex] = true;
            }
        } else {
            for(let i in growingBranches) {
                actuallyGrowingBranches[i] = true;
            }
        }
        for (let i in actuallyGrowingBranches) {
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

        if (growingBranches.length === 0) {
            isRunning = false;
        }
        logEl.innerHTML = `${isRunning ? 'is':'NOT'} running :: growing branches: ${growingBranches.length}, dead branches: ${deadBranchesCount}, matrix: ${Object.keys(growthMatrix).length}`;

        if (!isRunning) {
            if (runningInterval) {
                clearInterval(runningInterval);
            }
            return;
        }
    };
    // Spacebar toggles
    document.body.addEventListener('keypress', (e) => {
        if (e.keyCode === 32) {
            isRunning = !isRunning;
            if (isRunning) {
                runningInterval = setInterval(draw, growthInterval);
            } else {
                clearInterval(drawInterval);
            }
        }
    });
}
