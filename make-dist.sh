function makeHyphaeGrowingJs {
    local jsFile="./dist/hyphae-growing.js"
    echo "Compiling $jsFile";

    echo > $jsFile

    if [ "$1" = "prod" ]; then
        cat ./external/vue.min.js >> $jsFile && echo >> $jsFile
    else
        cat ./external/vue.js >> $jsFile && echo >> $jsFile
    fi

    cat ./pre-init-styles.js >> $jsFile && echo >> $jsFile

    cat ./hyphae-growing.js >> $jsFile && echo >> $jsFile

    cat ./creator.js >> $jsFile && echo >> $jsFile
}
makeHyphaeGrowingJs $1;