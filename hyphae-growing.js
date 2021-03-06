/*****************************************************
 * If you don't see anything, then just wait a while.
 *****************************************************/

function HyphaeGrowing(config, parentEl=false) {
    let isRunning = false;
    let isInit = false;
    let runningInterval = null;

    parentEl = parentEl === false ? document.body : (parentEl instanceof Element ? parentEl : document.querySelector(parentEl));
    if (!(parentEl instanceof Element)) {
        throw new Error('hyphae growing: no parent element');
    }
    const canvasEl = document.createElement('canvas');

    let width = null;
    let height = null;
    let startPos = null;
    let isStartPosCustomSet = false;
    let hyphalRadius = null;

    // init "click to start hyphae" CTA text/button
    let clickCtaEl = null;
    if (config.clickCtaEl) {
        clickCtaEl = (typeof config.clickCtaEl === 'string') ? document.querySelector(config.clickCtaEl) : config.clickCtaEl;
        // if somehow element is not found/not init, even though it exists in config, let's alert the dev via console
        if (!clickCtaEl) {
            console.error('"click to start hyphae" CTA text/button is missing', config.clickCtaEl);
        }
    }
    // how many clicks before we should hide the"click to start hyphae" CTA text/button
    let clickCtaClicksLeft = config.clickCtaClicksLeft || 3;

    const setBoundsAndStartPos = () => {
        const parentStyle = window.getComputedStyle(parentEl);
        width = parseInt(parentStyle.width);
        height = parseInt(parentStyle.height);

        // smaller of the two dimensions of canvas - a buffer
        hyphalRadius = Math.min(width, height)/2 - 20;
        if (!isStartPosCustomSet) {
            startPos = {x: width/2, y: height/2};
        }
        canvasEl.width = width;
        canvasEl.height = height;
    };

    parentEl.appendChild(canvasEl);
    const canvasContext = canvasEl.getContext("2d");

    const drawLine = (x1, y1, x, y, x0, y0) => {
        canvasContext.beginPath();
        canvasContext.strokeStyle = config.lineColor || 'black';
        canvasContext.lineWidth = Math.min(config.nearbyRadius || config.growthLengthIncrement, 3);
        canvasContext.lineJoin = "round";

        // if previous start coordinates exist: rendered canvas line smoother
        //   by re-drawing previous line and then drawing current one
        if (x0 !== null) {
            // previous line
            canvasContext.moveTo(x0, y0);
            canvasContext.lineTo(x, y);
        } else {
            // current line prep
            canvasContext.moveTo(x, y);
        }
        canvasContext.lineTo(x1, y1);
        canvasContext.stroke();
    };

    const isWithinBounds = (x,y) => {
        return x >= 0 && x < width && y >= 0 && y < height;
    };

    const isWithinHyphalCircle = (x,y) => {
        return Math.sqrt( Math.pow((x - (width/2)), 2) + Math.pow((y - (height/2)), 2) ) <= hyphalRadius;
    };


    // defaults
    if (!config.pBranchOff) config.pBranchOff = 0.3; // Probability of a new branch forming at tip
    if (!config.pBranchRandomDeath) config.pBranchRandomDeath = 0.0; // Probability of a branch spontaneously stopping growing
    if (!config.growthLengthMin) config.growthLengthMin = 2; // length of growth in pixels
    if (!config.growthLengthMax) config.growthLengthMax = 4; // length of growth in pixels
    if (!config.growthLengthIncrement) config.growthLengthIncrement = 2; // length of growth in pixels
    if (!config.allowBranchOverlap) config.allowBranchOverlap = false;
    if (!config.timeBetweenGrowth) config.timeBetweenGrowth = 10; // Speed of growth
    if (!config.angleDeltaRange) config.angleDeltaRange = 25;
    if (!config.branchMaxCount) config.branchMaxCount = 4;
    if (!config.branchGrowthMaxAttempts) config.branchGrowthMaxAttempts = 10;
    if (!config.pixelPrecision) config.pixelPrecision = 1;


    const restartOnCanvasClick = (e) => {
        stop();
        const canvasBounds = canvasEl.getBoundingClientRect();
        startPos = {x: e.x - canvasBounds.x, y: e.y - canvasBounds.y};
        isStartPosCustomSet = true;

        // if "click to start hyphae" CTA text/button is enabled & present
        //  and there are CTA clicks left, re-position the CTA
        //  NOTE: for positioning to work propertly, element must be "position: absolute"
        if (clickCtaEl && clickCtaClicksLeft) {
            clickCtaEl.style.left = `${startPos.x}px`;
            clickCtaEl.style.top = `${startPos.y}px`;
            // force the element width to 'auto'
            //  as it might have been set to some init value first
            //  we dont want the original width as we are positioning it to the mouse click
            clickCtaEl.style.width = 'auto';
        }
        start();
    };

    // Point at which the hyphae grows
    let growthMatrix = {};
    const isPointOccupied = (x,y) => {
        return growthMatrix[x+'_'+y];
    };

    const arePointsNearbyOccupied = (x,y, x0, y0) => {
        // nearby radius is either the explicit config prop or the growth increment
        const r = config.nearbyRadius || config.growthLengthIncrement;
        for(let xi=-1*r; xi<=r; xi++) {
            for(let yi=-1*r; yi<=r; yi++) {
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

    const Growth = (x, y, angle=null) => {
        if (angle === null) {
            // initial angle is random
            angle = Math.floor(Math.random() * 360);
        }
        let x0 = null, y0 = null; // save previous start coordinates to make rendered canvase lines smoother (see drawLine)

        const parentsAngles = [];

        let potentialBranchCount = Math.ceil(Math.random() * config.branchMaxCount);
        let attemptedBranchCount = 0;
        let growthCyclesWithoutBranching = 0;

        const grow = () => {

            let x1 = x, y1 = y, newAngle = 0;

            // attempts (i times)
            let hasGrownBranch = false;
            for(let ai = 0; ai < (config.allowBranchOverlap ? 1 : config.branchGrowthMaxAttempts); ai++) {
                // the new angle should add be [-angleDelta/2, +angleDelta/2]
                newAngle = angle + Math.floor((Math.random() * config.angleDeltaRange) - (config.angleDeltaRange/2));

                // consider ancestors branch angles (you just don't grow in a random new angle you want)
                //   you start growing based on where your mom, grandma, great-grandma grew
                //   IMPORTANT:  all angles of ancestors weighs are REVERSE (most important is the farthest ancestor)
                //              parent: weight=1, grandparent=2, great-grandparent=3, etc.
                //              current new angle weight = max ancestral memory weight
                //                 (HENCE: still pretty important
                //                  where you decide to grow yourself = as important as your )
                if (config.branchAngleAncestralMemory) {
                    let parentsAngleWeight = 1; // all generations weights equal
                    if (config.branchAngleAncestralMemoryMostWeightOn === 'closest') {
                        // closest parent (and myself) are most important
                        parentsAngleWeight = config.branchAngleAncestralMemory;
                    } else if (config.branchAngleAncestralMemoryMostWeightOn === 'farthest') {
                        // farthest ancestors are most important
                        parentsAngleWeight = 1;
                    }

                    let parentsAngleWeightsSum = parentsAngleWeight;
                    let newAngleWithParentsInMind = newAngle * parentsAngleWeight;
                    parentsAngles.forEach((parentAngle) => {
                        newAngleWithParentsInMind += (parentAngle * parentsAngleWeight);
                        parentsAngleWeightsSum += parentsAngleWeight;
                        if (config.branchAngleAncestralMemoryMostWeightOn === 'closest') {
                            // closest parent (and myself) are most important
                            parentsAngleWeight--;
                        } else if (config.branchAngleAncestralMemoryMostWeightOn === 'farthest') {
                            // farthest ancestors are most important
                            parentsAngleWeight++;
                        }
                    });
                    newAngleWithParentsInMind = newAngleWithParentsInMind / parentsAngleWeightsSum;
                    parentsAngles.unshift(newAngleWithParentsInMind);
                    if (parentsAngles.length > config.branchAngleAncestralMemory) {
                        parentsAngles.pop();
                    }

                    newAngle = newAngleWithParentsInMind;
                }


                const growthLength = config.growthLengthMin + Math.ceil(Math.random() * config.growthLengthMax);
                if (config.allowBranchOverlap) {
                    x1 = Math.round(x + (i * Math.cos(newAngle)));
                    y1 = Math.round(y + (i * Math.sin(newAngle)));
                    hasGrownBranch = isWithinBounds(x1, y1);
                } else {
                    let isFirstGrowthIncrement = true;
                    for(let i = config.growthLengthIncrement; i <= growthLength; i+=config.growthLengthIncrement) {
                        x1 = Math.round(x + (i * Math.cos(newAngle)));
                        y1 = Math.round(y + (i * Math.sin(newAngle)));

                        if (arePointsNearbyOccupied(x1,y1, x,y) || (config.frameMode === 'circle' && !isWithinHyphalCircle(x1, y1)) || !isWithinBounds(x1, y1)) {
                            // cannot grow that direction:
                            //   1. bumped into other branch  OR
                            //   2. bumped into the hyphae circle frame (if in circle-frame mode)    OR
                            //   3. bumped into the outer rectangle bounds of canvas
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
                drawLine(x1, y1, x, y, x0, y0);
                if (Math.random() < config.pBranchOff) {
                    // Create a new growing point from tip of branch and current angle
                    return Growth(x1, y1, newAngle);
                } else {
                    potentialBranchCount = Math.ceil(Math.random() * config.branchMaxCount);
                    attemptedBranchCount = 0;
                    growthCyclesWithoutBranching++;
                    x0 = x; // save previous start coordinates to make rendered canvase lines smoother (see drawLine)
                    y0 = y;
                    x = x1;
                    y = y1;
                }
            }

            return false;
        };

        return {
            grow,
            isDoneGrowing: () => {
                return (attemptedBranchCount >= potentialBranchCount) || Math.random() < (growthCyclesWithoutBranching * config.pBranchRandomDeath);
            }
        }
    };

    const growingBranches = [];

    const model = {
        maturedBranchesCount: 0,
        growingBranchesCount: 0,
        matrixPixelsCount: 0,
        isRunning: false,
        isInit: false
    };

    const draw = () => {
        const newBranches = [];
        const maturedBranches = [];

        const actuallyGrowingBranches = {};
        const growingBranchesCount = growingBranches.length;
        // if too many branches, pick only 500 random to grow at a time
        if (growingBranchesCount > 500) {
            for(let i=0; i<500; i++) {
                const randIndex = Math.floor(Math.random() * growingBranchesCount);
                actuallyGrowingBranches[randIndex] = true;
            }
        } else {
            for(let i in growingBranches) {
                actuallyGrowingBranches[i] = true;
            }
        }
        for (let i of Object.keys(actuallyGrowingBranches)) {
            const newBranch = growingBranches[i].grow();
            if (newBranch) {
                newBranches.push(newBranch);
            }

            if (growingBranches[i].isDoneGrowing()) {
                maturedBranches.push(i);
            }
        }

        maturedBranches.reverse();
        for (let i of maturedBranches) {
            growingBranches.splice(i,1);
        }
        for (let branch of newBranches) {
            growingBranches.push(branch);
        }

        if (growingBranches.length === 0) {
            isRunning = model.isRunning = false;
            callbackEventListeners('done-growing');
        }

        model.maturedBranchesCount += maturedBranches.length;
        model.growingBranchesCount = growingBranches.length;
        model.matrixPixelsCount = Object.keys(growthMatrix).length;

        callbackEventListeners('growing');

        if (!isRunning) {
            if (runningInterval) {
                clearInterval(runningInterval);
            }
            return;
        }
    };

    let eventListeners = {};
    const addEventListener = (type, cb) => {
        if (!eventListeners[type]) {
            eventListeners[type] = [];
        }
        eventListeners[type].push(cb);
    };
    const callbackEventListeners = (type) => {
        if (!eventListeners[type]) {
            return;
        }
        eventListeners[type].forEach((cb) => {
            cb();
        });
    };


    const init = () => {
        isInit = model.isInit = true;

        setBoundsAndStartPos();
        growingBranches.push(Growth(startPos.x, startPos.y));

        window.addEventListener('resize', onWindowResize);
    };

    const onWindowResize = () => {
        const wasRunning = isRunning;
        stop();

        if (wasRunning) {
            start();
        }
    };

    const stop = () => {
        if (!HyphaeGrowing.INSTANCE || !isInit) {
            return;
        }

        if (runningInterval) {
            clearInterval(runningInterval);
        }

        window.removeEventListener('resize', onWindowResize);

        growingBranches.splice(0);
        growthMatrix = {};

        canvasContext.clearRect(0, 0, width, height);
        isRunning = model.isRunning = false;
        isInit = model.isInit = false;

        model.maturedBranchesCount = 0;
        model.growingBranchesCount = 0;
        model.matrixPixelsCount = 0;

        isStartPosCustomSet = false;
    };

    const destroy = () => {
        stop();

        eventListeners = {};
        window.removeEventListener('resize', onWindowResize);
        canvasEl.removeEventListener('click', restartOnCanvasClick);
        canvasEl.removeEventListener('click', startPause);
        parentEl.removeChild(canvasEl);
        HyphaeGrowing.INSTANCE = null;
    };

    const startPause = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (!isRunning) {
            start();
        } else {
            pause();
        }
    };
    const start = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (!isInit) {
            init();
        }
        if (!isRunning) {
            runningInterval = setInterval(draw, config.timeBetweenGrowth);
        }

        // if "click to start hyphae" CTA text/button is enabled & present
        if (clickCtaEl) {
            // Decrement CTA clicks left
            if (clickCtaClicksLeft) {
                clickCtaClicksLeft--;
            } else {
                // at 0 clicks left, hide the CTA
                clickCtaEl.style.display = 'none'
            }
        }

        isRunning = model.isRunning = true;
        callbackEventListeners('started-growing');
    };

    const pause = () => {
        if (!HyphaeGrowing.INSTANCE) {
            return;
        }

        if (isRunning) {
            clearInterval(runningInterval);
        }
        isRunning = model.isRunning = false;
    };


    const getModel = () => {
        const clientModel = {};
        Object.entries(model).forEach((entry) => {
            clientModel[entry[0]] = entry[1];
        });
        return Object.freeze(clientModel);
    };


    if (config.restartAtClickPosition) {
        canvasEl.addEventListener('click', restartOnCanvasClick);
    } else if (config.startPauseOnClick) {
        canvasEl.addEventListener('click', startPause);
    }

    HyphaeGrowing.INSTANCE = {
        start,
        pause,
        startPause,
        stop,
        on: addEventListener,
        getModel
    };
    return HyphaeGrowing.INSTANCE;
}

HyphaeGrowing.getRandomFavoriteConfig = () => {
    const config = HyphaeGrowing.favoriteConfigs[Math.floor(Math.random() * HyphaeGrowing.favoriteConfigs.length)];
    const clientConfig = {};

    Object.entries(config).forEach((entry) => {
        clientConfig[entry[0]] = entry[1];
    });
    return clientConfig;
};

/*
Sample config
*/
HyphaeGrowing.favoriteConfigs = [
    {
        autoStart: false,
        lineColor: 'rgb(176, 137, 37)',
        branchAngleAncestralMemory: 2,
        branchAngleAncestralMemoryMostWeightOn: 'closest',
        pBranchOff : 0.3, // .4
        pBranchRandomDeath : 0, // values 0.01 - 0.05 seem to be good
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 25, // values 20 - 60 seem to work best
        branchMaxCount : 4, // values 4-8 seem to work well
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1,
        restartAtClickPosition: true,
        frameMode: 'rectangle'
    },
    {
        autoStart: false,
        lineColor: 'rgb(176, 137, 37)',
        branchAngleAncestralMemory: 0,
        pBranchOff : 0.4,
        pBranchRandomDeath : 0.05,
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 25,
        branchMaxCount : 4,
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1,
        restartAtClickPosition: true
    },
    {
        autoStart: false,
        lineColor: 'rgb(176, 137, 37)',
        branchAngleAncestralMemory: 0,
        pBranchOff : 0.3,
        pBranchRandomDeath : 0.0,
        growthLengthMin : 2,
        growthLengthMax : 4,
        growthLengthIncrement : 2,
        allowBranchOverlap : false,
        timeBetweenGrowth : 10,
        angleDeltaRange : 45,
        branchMaxCount : 4,
        branchGrowthMaxAttempts : 10,
        pixelPrecision : 1,
        restartAtClickPosition: true
    }
];
Object.freeze(HyphaeGrowing.favoriteConfigs);
/* */