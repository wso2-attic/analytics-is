/*
 * Copyright (c) 2016, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.wso2.analytics.is.common.pdf;

import org.pdfbox.pdmodel.font.PDFont;

import java.util.List;

public class Table extends PDFPageInfo {

    private PDFont textFont = DefaultConstants.DEFAULT_TEXT_FONT;
    private float fontSize = DefaultConstants.DEFAULT_FONT_SIZE;
    private float cellMargin = DefaultConstants.DEFAULT_CELL_MARGIN;
    private float rowHeight = DefaultConstants.DEFAULT_ROW_HEIGHT;
    private float tableTopY = DefaultConstants.DEFAULT_TABLE_TOP_Y;
    private List<Column> columns;
    private String[][] content;

    private PDFont tableHeaderFont = DefaultConstants.DEFAULT_TABLE_HEADER_FONT;
    private float tableHeaderFontSize = DefaultConstants.DEFAULT_TABLE_HEADER_FONT_SIZE;
    private Color tableHeaderBackgroundColor = DefaultConstants.DEFAULT_TABLE_HEADER_BACKGROUND_COLOR;
    private Color tableFontColor = DefaultConstants.DEFAULT_TABLE_FONT_COLOR;
    private Color alternativeRowColor = DefaultConstants.DEFAULT_ALTERNATIVE_ROW_COLOR;
    private Color tableBodyFillColor = DefaultConstants.DEFAULT_TABLE_BODY_FILL_COLOR;

    public float getTableWidth() {

        float tableWidth = 0f;
        for (Column column : columns) {
            tableWidth += column.getWidth();
        }
        return tableWidth;
    }

    public float getTableTopY() {
        return tableTopY;
    }

    public String[] getColumnsNamesAsArray() {

        String[] columnNames = new String[getNumberOfColumns()];
        for (int i = 0; i < getNumberOfColumns(); i++) {
            columnNames[i] = columns.get(i).getName();
        }
        return columnNames;
    }

    public List<Column> getColumns() {
        return columns;
    }

    public Integer getNumberOfColumns() {
        return this.getColumns().size();
    }

    public void setCellMargin(float cellMargin) {
        this.cellMargin = cellMargin;
    }

    public void setColumns(List<Column> columns) {
        this.columns = columns;
    }

    public void setContent(String[][] content) {
        this.content = content;
    }

    public void setRowHeight(float rowHeight) {
        this.rowHeight = rowHeight;
    }

    public void setTextFont(PDFont textFont) {
        this.textFont = textFont;
    }

    public void setFontSize(float fontSize) {
        this.fontSize = fontSize;
    }

    public void setTableTopY(float tableTopY) {
        this.tableTopY = tableTopY;
    }

    public float getCellMargin() {
        return cellMargin;
    }

    public float getRowHeight() {
        return rowHeight;
    }

    public PDFont getTextFont() {
        return textFont;
    }

    public float getTextFontSize() {
        return fontSize;
    }

    public String[][] getContent() {
        return content;
    }

    public void setTableHeaderFont(PDFont tableHeaderFont) {
        this.tableHeaderFont = tableHeaderFont;
    }

    public void setTableHeaderFontSize(float tableHeaderFontSize) {
        this.tableHeaderFontSize = tableHeaderFontSize;
    }

    public float getTableHeaderFontSize() {
        return tableHeaderFontSize;
    }

    public PDFont getTableHeaderFont() {
        return tableHeaderFont;
    }

    public void setTableHeaderBackgroundColor(Color tableHeaderBackgroundColor) {
        this.tableHeaderBackgroundColor = tableHeaderBackgroundColor;
    }

    public Color getTableHeaderBackgroundColor() {
        return tableHeaderBackgroundColor;
    }

    public void setTableFontColor(Color tableFontColor) {
        this.tableFontColor = tableFontColor;
    }

    public Color getTableFontColor() {
        return tableFontColor;
    }

    public void setAlternativeRowColor(Color alternativeRowColor) {
        this.alternativeRowColor = alternativeRowColor;
    }

    public Color getAlternativeRowColor() {
        return alternativeRowColor;
    }

    public void setTableBodyFillColor(Color tableBodyFillColor) {
        this.tableBodyFillColor = tableBodyFillColor;
    }

    public Color getTableBodyFillColor() {
        return tableBodyFillColor;
    }
}
