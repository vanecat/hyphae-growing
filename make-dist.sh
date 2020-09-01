function makeHyphaeGrowingJs {
    local jsFile="./dist/hyphae-growing.js"
    echo "Compiling $jsFile";

    echo > $jsFile

    cat ./external/vue.js >> $jsFile && echo >> $jsFile

    cat ./pre-init-styles.js >> $jsFile && echo >> $jsFile

    cat ./hyphae-growing.js >> $jsFile && echo >> $jsFile

    cat ./creator.js >> $jsFile && echo >> $jsFile
}
makeHyphaeGrowingJs;