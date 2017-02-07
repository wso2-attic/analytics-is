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

import org.pdfbox.exceptions.COSVisitorException;
import org.pdfbox.pdmodel.PDDocument;
import org.pdfbox.pdmodel.PDPage;
import org.pdfbox.pdmodel.edit.PDPageContentStream;
import org.pdfbox.pdmodel.graphics.xobject.PDJpeg;
import org.pdfbox.pdmodel.graphics.xobject.PDXObjectImage;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class PDFGenerator {
    /*
    *This method generates the PDF
    *@param pdf Object of PDFPageInfo class
    *@param table Object of Table class
    *@param header Object of Header class
    *@param footer Object of Footer class
    *@param fileLocation Location of the file as a String
    */
    public void generatePDF(PDFPageInfo pdfPageInfo, Table table, Header header, Footer footer, String fileLocation) throws IOException, COSVisitorException {

        File file = new File(fileLocation);
        boolean fileCreated = false;
        if (!file.exists()) {
            fileCreated = file.createNewFile();
        }
        if(fileCreated) {
            try(OutputStream os = new FileOutputStream(file)) {
                renderPDF(pdfPageInfo, table, header, footer, os);
            }
        }
    }

    private void renderPDF(PDFPageInfo pdf, Table table, Header header, Footer footer, OutputStream outputStream) throws IOException, COSVisitorException {

        if(table.getContent() != null && table.getContent().length != 0) {
            PDDocument pdfDoc = null;
            try {
                pdfDoc = new PDDocument();
                PDPage pdPage = generatePage(pdf, pdfDoc);
                PDPageContentStream contentStream = drawHeader(header, pdfDoc, pdPage);
                drawTable(pdfDoc, contentStream, pdf, table, footer);
                pdfDoc.save(outputStream);
            }
            catch(Exception ex) {
                throw ex;
            }
            finally {
                if(pdfDoc != null) {
                    pdfDoc.close();
                }
            }
        }
    }

    private PDPageContentStream drawHeader(Header header, PDDocument pdfDoc, PDPage page ) throws IOException {

        PDPageContentStream contentStream = getImage(header, pdfDoc, page);
        if(header != null) {
            if (header.getTitle() != null) {
                drawTitle(header, contentStream);
            }
            if (header.getHeaderInfo() != null) {
                drawHeaderInfo(header, contentStream);
            }
        }
        return contentStream;
    }

    private PDPageContentStream getImage(Header header, PDDocument pdfDoc, PDPage page) throws IOException {

        PDPageContentStream contentStream;
        File file = new File(System.getProperty("carbon.home") + header.getLogoLocation());
        if(file.exists() && !file.isDirectory()) {
            try (InputStream inputStream = new FileInputStream(file)) {
                contentStream = drawImage(header, pdfDoc, page, inputStream);
            } catch (NullPointerException ex) {
                contentStream = new PDPageContentStream(pdfDoc, page);
            }
        }
        else {
            try(InputStream inputStream = this.getClass().getResourceAsStream("/logo.jpg")) {
                contentStream = drawImage(header, pdfDoc, page, inputStream);
            } catch (NullPointerException ex) {
                contentStream = new PDPageContentStream(pdfDoc, page);
            }
        }
        return contentStream;
    }

    private PDPageContentStream drawImage(Header header, PDDocument pdfDoc, PDPage page, InputStream inputStream) throws IOException {

        PDXObjectImage ximage = new PDJpeg(pdfDoc, inputStream);
        PDPageContentStream contentStream = new PDPageContentStream(pdfDoc, page);
        contentStream.drawImage(ximage, header.getLogoCoordinates().x, page.getMediaBox().getHeight() -
                header.getLogoCoordinates().y, header.getLogoSize().x, header.getLogoSize().y);
        return contentStream;
    }

    private void drawTitle(Header header, PDPageContentStream contentStream) throws IOException {

        contentStream.setFont(header.getTitleFont(), header.getTitleFontSize());
        contentStream.beginText();
        contentStream.moveTextPositionByAmount(header.getTitleCoordinates().x, header.getTitleCoordinates().y);
        contentStream.drawString(header.getTitle());
        contentStream.endText();
    }

    private void drawHeaderInfo(Header header, PDPageContentStream contentStream) throws IOException {

        contentStream.setFont(header.getHeaderInfoFont(), header.getHeaderInfoFontSize());
        float headerInfoHeight = header.getHeaderInfoFont().getFontBoundingBox().getHeight() / 1000 * header.getHeaderInfoFontSize();
        float nexty = header.getHeaderCoordinates().y;
        for(int i = 0; i < header.getHeaderInfo().length; i++) {
            contentStream.beginText();
            contentStream.moveTextPositionByAmount(header.getHeaderCoordinates().x, nexty);
            nexty -= 2*headerInfoHeight;
            contentStream.drawString(header.getHeaderInfo()[i]);
            contentStream.endText();
        }
    }

    private void drawTable(PDDocument pdfDoc, PDPageContentStream contentStream, PDFPageInfo pdf, Table table, Footer footer) throws IOException {

        float nextY = drawTableHeader(contentStream, table);
        drawTableBody(contentStream, pdfDoc, pdf, table, nextY, footer);
    }

    private float drawTableHeader(PDPageContentStream contentStream, Table table) throws IOException {
        //draw the content line
        return writeContentLine(contentStream, table.getColumnsNamesAsArray(), table.getMargin(), table.getTableTopY() - table.getRowHeight(), table, false, true);
    }

    private float writeContentLine(PDPageContentStream contentStream, String[] lineContent, float nextTextX, float nextTextY, Table table,
                                   boolean IsEven, boolean IsHeader) throws IOException {
        float yStartPerRow;
        float lowestY = nextTextY;
        //Calculate lowest y to draw the background color
        for (int i = 0; i < table.getNumberOfColumns(); i++) {
            String text = lineContent[i];
            List<String> lines;
            if(IsHeader) {
                lines = getLinesPerRow(text, table.getColumns().get(i).getWidth(), table, true);
            }
            else {
                lines =  getLinesPerRow(text, table.getColumns().get(i).getWidth(), table, false);
            }
            yStartPerRow = nextTextY;
            for (int noOfLines = 0; noOfLines < lines.size(); noOfLines++) {
                yStartPerRow -= table.getRowHeight();
            }
            if(yStartPerRow < lowestY) {
                lowestY = yStartPerRow;
            }
        }
        //draw background color
        if(IsHeader) {
            contentStream.setNonStrokingColor(table.getTableHeaderBackgroundColor().r, table.getTableHeaderBackgroundColor().g, table.getTableHeaderBackgroundColor().b);
        }
        else {
            if (IsEven) {
                contentStream.setNonStrokingColor(table.getAlternativeRowColor().r, table.getAlternativeRowColor().g, table.getAlternativeRowColor().b);
            }
            else {
                contentStream.setNonStrokingColor(table.getTableBodyFillColor().r, table.getTableBodyFillColor().g, table.getTableBodyFillColor().b);
            }
        }
        //fill the Rectangle
        contentStream.fillRect(table.getMargin(), lowestY + table.getRowHeight() - table.getCellMargin(), table.getTableWidth(),  nextTextY - lowestY);
        contentStream.setNonStrokingColor(table.getTableFontColor().r, table.getTableFontColor().g, table.getTableFontColor().b);
        for (int i = 0; i < table.getNumberOfColumns(); i++) {
            String text = lineContent[i];
            List<String> lines;
            if(IsHeader) {
                lines = getLinesPerRow(text, table.getColumns().get(i).getWidth(), table, true);
                contentStream.setFont(table.getTableHeaderFont(), table.getTableHeaderFontSize());
            }
            else {
                lines =  getLinesPerRow(text, table.getColumns().get(i).getWidth(), table, false);
                contentStream.setFont(table.getTextFont(), table.getTextFontSize());
            }
            yStartPerRow = nextTextY;
            for (String line: lines) {
                contentStream.beginText();
                contentStream.moveTextPositionByAmount(nextTextX + table.getCellMargin(), yStartPerRow);
                contentStream.drawString(line != null ? line : "");
                contentStream.endText();
                yStartPerRow -= table.getRowHeight();
            }
            nextTextX += table.getColumns().get(i).getWidth();
        }
        return lowestY;
    }

    //If a line overflows in a row, This method returns a list that contains the lines
    private List<String> getLinesPerRow(String text, float width, Table table, boolean IsHeader) throws IOException {

        List<String> lines = new ArrayList<>();
        int lastSpace = -1;
        //checks if line overflows and break them into pieces of column width
        while (text.length() > 0) {
            int spaceIndex = text.indexOf(' ', lastSpace + 1);
            if (spaceIndex < 0) {
                spaceIndex = text.length();
            }
            String subString = text.substring(0, spaceIndex);
            float size;
            if(IsHeader) {
                size = table.getTableHeaderFontSize() * table.getTableHeaderFont().getStringWidth(subString) / 1000;
            }
            else {
                size = table.getTextFontSize() * table.getTextFont().getStringWidth(subString) / 1000;
            }
            if (size > width) {
                if (lastSpace < 0) {
                    lastSpace = spaceIndex;
                }
                subString = text.substring(0, lastSpace);
                float subStringSize;
                if(IsHeader) {
                    subStringSize =  table.getTableHeaderFontSize()*table.getTableHeaderFont().getStringWidth(subString) / 1000;
                }
                else {
                    subStringSize = table.getTextFontSize()*table.getTextFont().getStringWidth(subString) / 1000;
                }
                if(subStringSize > width) {
                    lastSpace = 0;
                    float stringWidth = 0;
                    //Checks width adding length of each character
                    while (stringWidth < width && subString.length() - 1 > lastSpace) {
                        lastSpace++;
                        if(IsHeader) {
                            stringWidth +=  table.getTableHeaderFont().getStringWidth(Character.toString(subString.charAt(lastSpace))) / 1000 * table.getTableHeaderFontSize();
                        }
                        else {
                            stringWidth += table.getTextFont().getStringWidth(Character.toString(subString.charAt(lastSpace))) / 1000 * table.getTextFontSize();
                        }
                    }
                    lastSpace -= 2;
                }
                subString = text.substring(0, lastSpace);
                lines.add(subString);
                text = text.substring(lastSpace).trim();
                lastSpace = -1;
            }
            else if (spaceIndex == text.length()) {
                lines.add(text);
                text = "";
            }
            else {
                lastSpace = spaceIndex;
            }
        }
        return lines;
    }

    private void drawTableBody(PDPageContentStream contentStream, PDDocument pdfDoc, PDFPageInfo pdf, Table table, float nextY, Footer footer) throws IOException {

        int pageNo = 0;
        for(int i = 0; i < table.getContent().length; i++) {
            if(nextY < table.getMargin()) {
                pageNo++;
                drawFooter(contentStream, footer, pageNo);
                contentStream.close();
                PDPage page = generatePage(pdf, pdfDoc);
                nextY = table.getPageSize().getHeight() - table.getMargin() - table.getRowHeight();
                contentStream = new PDPageContentStream(pdfDoc, page);

            }
            if(i % 2 == 0) {
               nextY = writeContentLine(contentStream, table.getContent()[i], table.getMargin(), nextY, table, true, false);
            }
            else {
                nextY = writeContentLine(contentStream, table.getContent()[i], table.getMargin(), nextY, table, false, false);
            }
        }
        pageNo++;
        drawFooter(contentStream, footer, pageNo);
        drawAfterTableContent(contentStream, footer, nextY, pageNo, pdf, pdfDoc);
        contentStream.close();
    }

    private void drawFooter(PDPageContentStream contentStream, Footer footer, int pageNo) throws IOException {

        contentStream.beginText();
        if(footer != null) {
            contentStream.moveTextPositionByAmount(footer.getFooterCoordinates().x, footer.getFooterCoordinates().y);
            if (footer.getFooterContent() != null) {
                contentStream.drawString(footer.getFooterContent() + " - " + pageNo);
            }
            else {
                contentStream.drawString("" + pageNo);
            }
        }
        else {
            contentStream.moveTextPositionByAmount(DefaultConstants.DEFAULT_FOOTER_COORDINATES.x, DefaultConstants.DEFAULT_FOOTER_COORDINATES.y);
            contentStream.drawString("" + pageNo);
        }
        contentStream.endText();
    }

    private void drawAfterTableContent(PDPageContentStream contentStream, Footer footer, float nextY, int pageNo, PDFPageInfo pdf, PDDocument pdfDoc) throws IOException {

        if(footer != null) {
            if(footer.getAfterTableContent() != null) {
                contentStream.beginText();
                if(nextY < footer.getMargin()) {
                    pageNo++;
                    drawFooter(contentStream, footer, pageNo);
                    contentStream.close();
                    PDPage page = generatePage(pdf, pdfDoc);
                    nextY = footer.getPageSize().getHeight() - 2 * footer.getMargin();
                    contentStream = new PDPageContentStream(pdfDoc, page);
                }
                contentStream.moveTextPositionByAmount(footer.getMargin(), nextY - footer.getMargin());
                contentStream.drawString(footer.getAfterTableContent());
                contentStream.endText();
            }
        }
    }

    private PDPage generatePage(PDFPageInfo pdf, PDDocument pdfDoc) {

        PDPage page = new PDPage();
        page.setMediaBox(pdf.getPageSize());
        pdfDoc.addPage(page);
        return page;
    }
}
