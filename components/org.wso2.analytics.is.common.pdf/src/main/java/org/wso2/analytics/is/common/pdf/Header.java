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

public class Header extends PDFPageInfo {
    //Logo Attributes
    private Point logoCoordinates = DefaultConstants.DEFAULT_LOGO_COORDINATES;
    private Point logoSize = DefaultConstants.DEFAULT_LOGO_SIZE;
    private String logoLocation = DefaultConstants.DEFAULT_LOGO_LOCATION;

    //Title Attributes
    private String title;
    private PDFont titleFont = DefaultConstants.DEFAULT_TITLE_FONT;
    private float titleFontSize = DefaultConstants.DEFAULT_TITLE_FONT_SIZE;
    private Point titleCoordinates = DefaultConstants.DEFAULT_TITLE_COORDINATES;

    //HeaderInfo Attributes
    private String[] headerInfo;
    private PDFont headerInfoFont = DefaultConstants.DEFAULT_HEADER_INFO_FONT;
    private float headerInfoFontSize = DefaultConstants.DEFAULT_HEADER_INFO_FONT_SIZE;
    private Point headerCoordinates = DefaultConstants.DEFAULT_HEADER_COORDINATES;

    public Point getLogoCoordinates() {
        return logoCoordinates;
    }

    public Point getLogoSize() {
        return logoSize;
    }

    public String getLogoLocation() {
        return logoLocation;
    }

    public PDFont getTitleFont() {
        return titleFont;
    }

    public float getTitleFontSize() {
        return titleFontSize;
    }

    public String getTitle() {
        return title;
    }

    public Point getTitleCoordinates() {
        return titleCoordinates;
    }

    public void setLogoCoordinates(Point logoCoordinates) {
        this.logoCoordinates = logoCoordinates;
    }

    public void setLogoSize(Point logoSize) {
        this.logoSize = logoSize;
    }

    public void setLogoLocation(String logoLocation) {
        this.logoLocation = logoLocation;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setTitleFont(PDFont titleFont) {
        this.titleFont = titleFont;
    }

    public void setTitleFontSize(float titleFontSize) {
        this.titleFontSize = titleFontSize;
    }

    public void setTitleCoordinates(Point titleCoordinates) {
        this.titleCoordinates = titleCoordinates;
    }

    public PDFont getHeaderInfoFont() {
        return headerInfoFont;
    }

    public float getHeaderInfoFontSize() {
        return headerInfoFontSize;
    }

    public String[] getHeaderInfo() {
        return headerInfo;
    }

    public Point getHeaderCoordinates() {
        return headerCoordinates;
    }

    public void setHeaderInfo(String[] headerInfo) {
        this.headerInfo = headerInfo;
    }

    public void setHeaderInfoFont(PDFont headerInfoFont) {
        this.headerInfoFont = headerInfoFont;
    }

    public void setHeaderInfoFontSize(float headerInfoFontSize) {
        this.headerInfoFontSize = headerInfoFontSize;
    }

    public void setHeaderCoordinates(Point headerCoordinates) {
        this.headerCoordinates = headerCoordinates;
    }
}
