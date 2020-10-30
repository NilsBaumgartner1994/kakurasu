/**
 * KAKARASU is a puzzle game. In a grid there are for each row and column values to be satisfied. To satisfy such a
 * constraint all activ cells in the specific row/column are summed up. The game is won, when all row and column
 * constraints are satisfied.
 */
const _FIELD_KEY_SEPERATOR = "-";
const STATUS_CLEAR = 0;
const STATUS_ACTIVE = 1;
const STATUS_FLAGGED = 2;

const CLEANVALUE_MOVEHISTORY = [];
const CLEANVALUE_CURRENTMOVEINDEX = null;


class Kakurasu {

    /**
     * Constructor of a new game
     * @param state json state of a game to load
     * use to asJSON method to export/save a game
     */
    constructor(state = {}) {
        this.state = {};
        this.state.moveHistory = state.moveHistory || CLEANVALUE_MOVEHISTORY;
        this.state.currentMoveIndex = state.currentMoveIndex || CLEANVALUE_CURRENTMOVEINDEX;
        if(!this.state.currentMoveIndex && this.state.moveHistory.length > 0){
            this.state.currentMoveIndex = this.state.moveHistory.length-1;
        }

        if(!state.fields) {
            state.fields = KakurasuLevelGenerator.generateLevel();
        }
        this.state.fields = {};
        let fieldKeys = Object.keys(state.fields);
        for(let i=0; i<fieldKeys.length; i++){
            let fieldKey = fieldKeys[i];
            let fieldJSON = state.fields[fieldKey];
            this.state.fields[fieldKey] = new KakurasuField(fieldJSON);
        }
        this._loadFieldMetaInformations();
    }

    /**
     * returns the amount of moves made
     * @returns {number}
     */
    getAmountMoves(){
        return this.state.moveHistory.length;
    }

    /**
     * Resets the game to original start
     */
    resetGame(){
        let fieldKeys = Object.keys(this.state.fields);
        for(let i=0; i<fieldKeys.length; i++){
            let fieldKey = fieldKeys[i];
            let field = this.state.fields[fieldKey];
            field._reset();
            this.state.fields[fieldKey] = field;
        }
        this.state.moveHistory = CLEANVALUE_MOVEHISTORY;
        this.state.currentMoveIndex = CLEANVALUE_CURRENTMOVEINDEX;
    }

    /**
     * Makes a move to set a field active
     * @param row Index of the row
     * @param column Index of the column
     * @returns {boolean} move could be applied
     */
    setFieldActive(row, column){
        return this._setFieldStatus(row,column,STATUS_ACTIVE);
    }

    /**
     * Makes a move to set a field flagged
     * @param row Index of the row
     * @param column Index of the column
     * @returns {boolean} move could be applied
     */
    setFieldFlagged(row,column){
        return this._setFieldStatus(row,column,STATUS_FLAGGED);
    }

    /**
     * Makes a move to set a field clear
     * @param row Index of the row
     * @param column Index of the column
     * @returns {boolean} move could be applied
     */
    setFieldClear(row,column){
        return this._setFieldStatus(row,column,STATUS_CLEAR);
    }

    /**
     * Changes/Flipps the active state of a field
     * @param row the row index, starting at 0
     * @param column the column index, starting at 0
     * @returns {boolean} if change was allowed
     */
    changeActiveStatus(row,column){
        let field = this.getField(row,column);
        if(field.isClear()){
            return this.setFieldActive(row,column);
        } else {
            return this.setFieldClear(row,column);
        }
    }

    /**
     * Changes/Flipps the flag state of a field
     * @param row the row index, starting at 0
     * @param column the column index, starting at 0
     * @returns {boolean} if change was allowed
     */
    changeFlagStatus(row,column){
        let field = this.getField(row,column);
        if(field.isClear()){
            return this.setFieldFlagged(row,column);
        } else {
            return this.setFieldClear(row,column);
        }
    }

    _setFieldStatus(row,column, status){
        let field = this.getField(row,column);
        let move = {
            row: row,
            column: column,
            previousStatus: field.getStatus(),
            nextStatus: status
        }
        return this._makeMove(move);
    }

    _makeMove(move){
        let moveApplied = this._applyMove(move);
        if(moveApplied){
            this._addMoveToHistory(move);
        }
        return moveApplied;
    }

    _addMoveToHistory(move){
        this._deleteFutureMoveHistory();
        this.state.moveHistory.push(move);
        this._changeCurrentMoveIndex(1);
    }

    _deleteFutureMoveHistory(){
        let currentIndex = this.state.currentMoveIndex;
        if(!isNaN(parseInt(currentIndex))) {
            let newHistory = [];
            /**
            for(let i=0; i<currentIndex+1; i++){
                let moveToSave = this.state.moveHistory[i];
                newHistory.push(moveToSave);
            }
            */
            newHistory = this.state.moveHistory.slice(0,currentIndex+1);
            this.state.moveHistory = newHistory;
        } else {
            this.state.moveHistory = [];
        }
    }

    _changeCurrentMoveIndex(diff){
        this.state.currentMoveIndex = this._calcNextCurrentMoveIndex(diff);
    }

    _calcNextCurrentMoveIndex(diff){
        let copy = this.state.currentMoveIndex;
        let notANumber = isNaN(parseInt(copy)); // isNaN(null) ==> false !!!
        if(notANumber){ //0 is not an invalid index !
            if(diff > 0){
                copy = 0;
                diff = diff -1;
                if(diff > 0){
                    copy = diff;
                }
            }
            //all other cases are not relevant, since we have no history
        } else { //we have a current index
            copy = copy+diff;
            if(copy<0){
                copy = null;
            }
        }
        return copy;
    }

    _getFieldFromMove(move){
        return this.getField(move.row,move.column);
    }

    _applyMove(move){
        let field = this._getFieldFromMove(move);
        if(!field.isReadOnly()){
            field.setStatus(move.nextStatus);
            return true;
        }
        return false;
    }

    /**
     * Get the KakurasuField
     * @param row the row index, starting at 0
     * @param column the column index, starting at 0
     * @returns {*} Get the KakurasuField
     */
    getField(row,column){
        let fieldKey = Kakurasu._getFieldKey(row,column);
        let field = this.state.fields[fieldKey];
        field.row = row;
        field.column = column;
        return field;
    }

    static _getFieldKey(row,column){
        return row+_FIELD_KEY_SEPERATOR+column;
    }

    /**
     * Get the field of the current move
     * @returns {null|*}
     */
    getFieldOfCurrentMove(){
        let currentMove = this.getMoveFromHistoryAsCopy(this._calcNextCurrentMoveIndex(0));
        if(!!currentMove){
            return this._getFieldFromMove(currentMove);
        }
        return null;
    }

    /**
     * Is is possible to redo a move
     * @returns {boolean} redo is possible at current time
     */
    isPossibleToRedoMove() {
        let moveToBeRedone = this.getMoveFromHistoryAsCopy(this._calcNextCurrentMoveIndex(1));
        return !!moveToBeRedone;
    }

    /**
     * Redo the last move if there are any moves undone
     * @returns {boolean} if change could be redone (should be always true)
     */
    redoMove(){
        if(this.isPossibleToRedoMove()){
            let moveToBeRedone = this.getMoveFromHistoryAsCopy(this._calcNextCurrentMoveIndex(1));
            this._changeCurrentMoveIndex(1);
            return this._applyMove(moveToBeRedone);
        }
        return false;
    }

    /**
     * Get a Move from the history
     * @param moveIndex move index from the history
     * @returns {*}
     */
    getMoveFromHistoryAsCopy(moveIndex){
        let move = this.state.moveHistory[moveIndex];
        if(!!move){
            move = JSON.parse(JSON.stringify(move));
        }
        return move;
    }

    /**
     * Is is possible to undo a move
     * @returns {boolean} undo is possible at current time
     */
    isPossibleToUndoMove(){
        let moveToBeUndone = this.getMoveFromHistoryAsCopy(this._calcNextCurrentMoveIndex(0));
        return !!moveToBeUndone;
    }

    /**
     * Undo the last move made if there are any moves to undo
     * @returns {boolean} if a move can be undone
     */
    undoMove(){
        if(this.isPossibleToUndoMove()){
            let moveToBeUndone = this.getMoveFromHistoryAsCopy(this._calcNextCurrentMoveIndex(0));
            let helperNextStatus = moveToBeUndone.nextStatus;
            moveToBeUndone.nextStatus = moveToBeUndone.previousStatus;
            moveToBeUndone.previousStatus = helperNextStatus;
            this._changeCurrentMoveIndex(-1);
            return this._applyMove(moveToBeUndone);
        }
        return false;
    }

    /**
     * Get the game state as json, which can used in the constructor
     * @returns {any} state of the game as json
     */
    asJSON(){
        let fields = Kakurasu._fieldsAsJSON(this.state.fields);
        let state = JSON.parse(JSON.stringify(this.state));
        state.fields = fields;
        return state;
    }

    static _fieldsAsJSON(fields){
        let fieldsCopy = {};
        let fieldKeys = Object.keys(fields);
        for(let i=0; i < fieldKeys.length; i++){
            let fieldKey = fieldKeys[i];
            let field = fields[fieldKey];
            fieldsCopy[fieldKey] = field.asJSON();
        }
        return fieldsCopy;
    }

    /**
     * checks if the game is finished/won and all constraints are satisfied
     * @returns {boolean|boolean} if level is finished
     */
    isGameWon(){
        let allRowsSatisfied = this._areAllRowColumnContraintsSatisfied(true);
        if(!allRowsSatisfied){
            return false;
        }
        let allColumnsSatisfied = this._areAllRowColumnContraintsSatisfied(false);
        if(!allColumnsSatisfied){
            return false;
        }
        return allRowsSatisfied && allColumnsSatisfied;
    }

    _areAllRowColumnContraintsSatisfied(forRow=false){
        let length = this._getAmountRowColumns(forRow);
        for(let i=0; i<length; i++){
            let constraintSatisfied = this._isRowColumnConstraintSatisfied(true, i);
            if(!constraintSatisfied){
                return false;
            }
        }
        return true;
    }

    _getAmountRowColumns(forRow){
        return forRow ? this.getAmountRows() : this.getAmountColumns();
    }

    /**
     * Checks if row is satisfied
     * @param row the index of the row
     * @returns {boolean} satisfied row
     */
    isRowConstraintSatisfied(row){
        return this._isRowColumnConstraintSatisfied(true, row);
    }

    /**
     * Checks if column is satisfied
     * @param column the index of the column
     * @returns {boolean} satisfied column
     */
    isColumnConstraintSatisfied(column){
        return this._isRowColumnConstraintSatisfied(false, column);
    }

    _isRowColumnConstraintSatisfied(forRow, index){
        let solutionValue = this._getConstraintValue(forRow, index);
        let fieldsValue = this._getRowColumnSumValue(forRow, index);
        return solutionValue===fieldsValue;
    }

    _getRowColumnSumValue(forRow=false, index){
        let fields = this._getFieldsInRowColumn(forRow, index);
        let fieldsValue = 0;
        for(let i=0; i<fields.length; i++){
            let field = fields[i];
            let weight = this._getWeightForField(forRow, field);
            if(field.isActive()){
                fieldsValue+=weight;
            }
        }
        return fieldsValue;
    }

    _loadFieldMetaInformations(){
        this.meta = {};
        this._loadFiledMetaInformationsAmountRowsAndColumns();
        this._loadFieldMetaInformationsContraints();
    }

    _loadFiledMetaInformationsAmountRowsAndColumns(){
        let fields = this.state.fields;
        let fieldKeys = Object.keys(fields);
        let highestRowKey = null;
        let highestColumnKey = null;
        for(let i=0; i<fieldKeys.length; i++){
            let fieldKey = fieldKeys[i];
            let split = fieldKey.split(_FIELD_KEY_SEPERATOR);
            let column = parseInt(split[0]);
            let row = parseInt(split[1]);
            if(!highestColumnKey || highestColumnKey<column){
                highestColumnKey = column;
            }
            if(!highestRowKey || highestRowKey<column){
                highestRowKey = row;
            }
        }

        this.meta.amountRows = highestRowKey !== null ? highestRowKey+1 : 0;
        this.meta.amountColumns = highestColumnKey !== null ? highestColumnKey+1 : 0;
    }

    _loadFieldMetaInformationsContraints(){
        this.meta.contraints = {};
        this.meta.contraints[this._getConstraintRowOrColumn(true)] = {};
        this.meta.contraints[this._getConstraintRowOrColumn(false)] = {};

        this._loadFieldMetaInformationsConstraintsForRowColumn(true);
        this._loadFieldMetaInformationsConstraintsForRowColumn(false);
    }

    _loadFieldMetaInformationsConstraintsForRowColumn(forRow=false){
        let length = forRow ? this.getAmountRows() : this.getAmountColumns();
        for(let i=0; i<length; i++){
            this._loadFieldMetaInformationsContraintsForFields(forRow, i);
        }
    }

    /**
     * Get the weight of the row/column index
     * @param index
     * @returns {*}
     */
    getWeight(index){
        return index+1;
    }

    /**
     * Get a list of all fields in a row index
     * @param row the index of the row
     * @returns {[]} list of KakarasuField
     */
    getFieldsInRow(row){
        return this._getFieldsInRowColumn(true, row);
    }

    /**
     * Get a list of all fields in a column index
     * @param column the index of the column
     * @returns {[]} list of KakarasuField
     */
    getFieldsInColumn(column){
        return this._getFieldsInRowColumn(false, column);
    }

    _getFieldsInRowColumn(forRow, index){
        let selectedFields = [];
        let length = this._getAmountRowColumns(forRow);
        for(let i=0; i<length; i++){
            let row = forRow ? index : i;
            let column = forRow ? i : index;
            let field = this.getField(row,column);
            selectedFields.push(field);
        }
        return selectedFields;
    }

    _getWeightForField(forRow=false, field){
        let weightIndex = forRow ? field.column : field.row;
        return this.getWeight(weightIndex);
    }

    _loadFieldMetaInformationsContraintsForFields(forRow=false, index){
        let fields = this._getFieldsInRowColumn(forRow, index);
        let solutionValue = 0;
        for(let i=0; i<fields.length; i++){
            let field = fields[i];
            let weight = this._getWeightForField(forRow, field);
            let isSolution = field.isSolution();
            if(isSolution){
                solutionValue+=weight;
            }
        }

        let constraintRowOrColumn = this._getConstraintRowOrColumn(forRow);
        this.meta.contraints[constraintRowOrColumn][index] = solutionValue;
    }

    /**
     * Get the constraint value for a row
     * @param row the row index
     * @returns {number} integer of the constraint value
     */
    getConstraintValueForRow(row){
        return this._getConstraintValue(true, row);
    }

    /**
     * Get the constraint value for a column
     * @param column the column index
     * @returns {number} integer of the constraint value
     */
    getConstraintValueForColumn(column){
        return this._getConstraintValue(false, column);
    }

    _getConstraintValue(forRow=false, index){
        let constraintRowOrColumn = this._getConstraintRowOrColumn(forRow);
        return this.meta.contraints[constraintRowOrColumn][index];
    }

    _getConstraintRowOrColumn(forRow){
        return forRow ? "rows" : "columns";
    }

    /**
     * Get the amount of rows
     * @returns {number} the amount of rows
     */
    getAmountRows(){
        return this.meta.amountRows;
    }

    /**
     * Get the amount of columns
     * @returns {number} the amount of columns
     */
    getAmountColumns(){
        return this.meta.amountColumns;
    }

    /**
     * Get the highest constraint value. Usefull for padding
     * @returns {number|null}
     */
    getHighestConstraintValue(){
        let highestRowConstraint = this.getHighestConstraintForColumnRow(true);
        let highestColumnConstraint = this.getHighestConstraintForColumnRow(false);
        return highestRowConstraint > highestColumnConstraint ? highestRowConstraint : highestColumnConstraint;
    }

    /**
     * Get the highest constraint value in a row/column
     * @param forRow if for row is searched
     * @returns {number|null} the highest constraint in the row/column
     */
    getHighestConstraintForColumnRow(forRow){
        let length = this._getAmountRowColumns(forRow);
        let maxValue = null;
        for(let i=0; i<length; i++){
            let value = forRow ? this.getConstraintValueForRow(i) : this.getConstraintValueForColumn(i);
            if(maxValue === null || maxValue < value){
                maxValue = value;
            }
        }
        return maxValue;
    }

    /**
     * DEBUGGING ! Print the field.
     * @returns {string} string for the console with solutions as S labeld
     */
    print(){
        let rows = this.getAmountRows();
        let columns = this.getAmountColumns();
        let largestIndexLength = rows > columns ? (rows+"").length : (columns+"").length;
        let largestConstraintLength = (this.getHighestConstraintValue()+"").length;
        let largestAmount = largestIndexLength > largestConstraintLength ? largestIndexLength : largestConstraintLength;
        let output = "".padStart(largestAmount," ")+"|";
        for(let column=0; column < columns; column++){
            output += (this.getWeight(column)+"").padStart(largestAmount," ")+"|";
        }
        output += "".padStart(largestAmount," ")+"\n";
        for(let row=0; row<rows; row++){
            output += ("").padStart(largestAmount,"-")+"+";
            for(let column=0; column < columns; column++){
                output += "".padStart(largestAmount,"-")+"+";
            }
            output += "".padStart(largestAmount,"-")+"\n";
            output += (this.getWeight(row)+"").padStart(largestAmount," ")+"|";
            for(let column=0; column < columns; column++){
                let field = this.getField(row,column);
                let icon = field.isSolution() ? "" : "";
                if(field.isActive()){
                    icon = "A";
                }
                if(field.isFlagged()){
                    icon = "x";
                }

                output += icon.padStart(largestAmount," ")+"|";
            }
            output += (this.getConstraintValueForRow(row)+"").padStart(largestAmount," ")+"\n";
        }

        output += ("").padStart(largestAmount,"-")+"+";
        for(let column=0; column < columns; column++){
            output += "".padStart(largestAmount,"-")+"+";
        }
        output += "".padStart(largestAmount,"-")+"\n";
        output += "".padStart(largestAmount," ")+"|";
        for(let column=0; column < columns; column++){
            output += (this.getConstraintValueForColumn(column)+"").padStart(largestAmount," ")+"|";
        }

        return output;
    }

}

/**
 * A Field for the game Kakarasu
 */

class KakurasuField {

    /**
     * Constructor for a field
     * @param state json [optional]
     */
    constructor(state = {status: STATUS_CLEAR}) {
        this.state = state;
    }

    _reset(){
        if(!this.isReadOnly()){
            this.setStatus(STATUS_CLEAR);
        }
    }

    /**
     * Set the status of a field
     * @param status 0=Clear, 1=active, 2=flagged
     */
    setStatus(status){
        this.state.status = status;
    }

    /**
     * Get the field status
     * @returns {number} 0=Clear, 1=active, 2=flagged
     */
    getStatus(){
        return this.state.status;
    }

    /**
     * Is the status of a field clear
     * @returns {boolean} field is clear
     */
    isClear(){
        return this.state.status === STATUS_CLEAR;
    }

    /**
     * Is the status of a field active
     * @returns {boolean} field is active
     */
    isActive(){
        return this.state.status === STATUS_ACTIVE;
    }

    /**
     * Is the status of a field flagged
     * @returns {boolean} field is flagged
     */
    isFlagged(){
        return this.state.status === STATUS_FLAGGED;
    }

    /**
     * Set a field editable
     * @param editable is editable field
     */
    setReadOnly(readOnly){
        if(readOnly){
            this.state.readOnly = true;
        } else {
            delete this.state.readOnly;
        }
    }

    /**
     * Is a field editable
     * @returns {boolean} field is editable
     */
    isReadOnly(){
        return !!this.state.readOnly;
    }

    /**
     * Set a field as part of the correct solution
     * @param solution is part of correct soluation
     */
    setIsSolution(solution){
        this.state.solution = solution;
    }

    /**
     * Is a field part of the correct solution
     * @returns {boolean} field is part of solution
     */
    isSolution(){
        return this.state.solution;
    }

    /**
     * get the state of the field
     * @returns {{status: number},{solution: boolean},{readOnly: boolean}}
     */
    getState(){
        return this.state;
    }

    /**
     * Get the field as json. Can be used as construction parameter
     * @returns {{status: number}}
     */
    asJSON(){
        return this.getState();
    }
}

/**
 * A level generator for the Kakarasu game
 * Generate a specific level by using a dict {fields: fields} as parameter for the kakarasu constructor
 */
class KakurasuLevelGenerator {



    //generate easy/medium/hard
    //generate AxB
    /**
     * Generate a new level
     * @param config {rows: amountRows, columns: amountColumns, [amountMinimumInRow: amountMinimumInRow], [amountMaximumInRow: amountMaximumInRow], [amountMinimumInColumn: amountMinimumInColumn], [amountMaximumInColumn, amountMaximumInColumn]}
     * @returns {{}} fields for the kakarasu constructor {fields: fields}
     */
    static generateLevel(config){
        config = config || {};
        config.rows = config.rows || 5;
        config.columns = config.columns || config.rows;
        config.difficulty = config.difficulty || "medium";
        config.amountMinimumInRow = config.amountMinimumInRow || 1;
        config.amountMaximumInRow = config.amountMaximumInRow || config.rows/2;
        config.amountMinimumInColumn = config.amountMinimumInColumn || 1;
        config.amountMaximumInColumn = config.amountMaximumInColumn || config.columns/2;


        if(config.amountMinimumInRow<0){
            config.amountMinimumInRow = 0;
        }
        if(config.amountMinimumInRow>config.rows){
            config.amountMinimumInRow = config.rows;
        }
        if(config.amountMaximumInRow>config.rows){
            config.amountMaximumInRow = config.rows;
        }
        if(config.amountMaximumInRow<0){
            config.amountMaximumInRow = 0;
        }
        if(config.amountMaximumInRow<config.amountMinimumInRow){
            config.amountMaximumInRow = config.amountMinimumInRow;
        }


        if(config.amountMinimumInColumn<0){
            config.amountMinimumInColumn = 0;
        }
        if(config.amountMinimumInColumn>config.columns){
            config.amountMinimumInColumn = config.columns;
        }
        if(config.amountMaximumInColumn>config.columns){
            config.amountMaximumInColumn = config.columns;
        }
        if(config.amountMaximumInColumn<0){
            config.amountMaximumInColumn = 0;
        }
        if(config.amountMaximumInColumn<config.amountMinimumInColumn){
            config.amountMaximumInColumn = config.amountMinimumInColumn;
        }

        let fields = KakurasuLevelGenerator._initEmptyField(config.rows,config.columns);
        fields = KakurasuLevelGenerator._setSolutionFieldsForRowColumn(true, fields, config);
        fields = KakurasuLevelGenerator._setSolutionFieldsForRowColumn(false, fields, config);

        return Kakurasu._fieldsAsJSON(fields);
    }

    static _setSolutionFieldsForRowColumn(forRow, fields, config){
        let outerLength = forRow ? config.rows : config.columns;
        for(let outerIndex=0; outerIndex<outerLength; outerIndex++){
            let solutionIndexes = [];
            if(forRow){
                solutionIndexes = KakurasuLevelGenerator._selectRandomAmountIndexes(config.columns, config.amountMinimumInColumn, config.amountMaximumInColumn);
            } else {
                solutionIndexes = KakurasuLevelGenerator._selectRandomAmountIndexes(config.rows, config.amountMinimumInRow, config.amountMaximumInRow);
            }
            for(let i=0; i<solutionIndexes.length; i++){
                let solutionIndex = solutionIndexes[i];
                let row = forRow ? outerIndex : solutionIndex;
                let column = forRow ? solutionIndex : outerIndex;

                let fieldKey = Kakurasu._getFieldKey(row,column);
                let field = fields[fieldKey];
                field.setIsSolution(true);
                fields[fieldKey] = field;
            }
        }
        return fields;
    }

    static _initEmptyField(rows, columns){
        let fields = {};

        for(let y=0; y<rows; y++){
            let row = y;
            for(let x=0; x<columns; x++){
                let column = x;
                let fieldKey = Kakurasu._getFieldKey(row,column);
                fields[fieldKey] = new KakurasuField();
            }
        }
        return fields;
    }

    static _selectRandomAmountIndexes(maxAmount, amountMinimalSelectedIndex, amountMaximalSelectedIndex){
        let amountToSelect = KakurasuLevelGenerator._getRandomInt(amountMinimalSelectedIndex,amountMaximalSelectedIndex);
        let indexArray = Array.from(Array(maxAmount).keys()); // 10 => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        let shuffledArray = KakurasuLevelGenerator._shuffle(indexArray);
        let selectedArray = [];
        for(let i=0; i<amountToSelect; i++){
            selectedArray.push(shuffledArray[i]);
        }
        return selectedArray;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive).
     * The value is no lower than min (or the next integer greater than min
     * if min isn't an integer) and no greater than max (or the next integer
     * lower than max if max isn't an integer).
     * Using Math.round() will give you a non-uniform distribution!
     */
    static _getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Shuffles array in place.
     * @param {Array} a items An array containing the items.
     */
    static _shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

}

/**
console.log("Kakarasu Test");
let game = new Kakurasu();
game.changeActiveStatus(0,0);
game.changeActiveStatus(0,1);
game.changeActiveStatus(0,2);
game.changeActiveStatus(0,3);
game.changeActiveStatus(0,4);
console.log("INIT");
console.log(game.print())
console.log("")
*/

module.exports.Kakurasu = Kakurasu;
module.exports.KakurasuField = KakurasuField;
module.exports.KakurasuLevelGenerator = KakurasuLevelGenerator;