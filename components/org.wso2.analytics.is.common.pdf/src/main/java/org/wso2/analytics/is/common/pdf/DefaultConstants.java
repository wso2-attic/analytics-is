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

import org.pdfbox.pdmodel.PDPage;
import org.pdfbox.pdmodel.common.PDRectangle;
import org.pdfbox.pdmodel.font.PDFont;
import org.pdfbox.pdmodel.font.PDType1Font;

public class DefaultConstants {

    //Constants used in Header
    //Image Attributes
    public static final Point DEFAULT_LOGO_COORDINATES = new Point(40, 60);

    public static final Point DEFAULT_LOGO_SIZE = new Point(140, 55);

    public static final String DEFAULT_LOGO_LOCATION = "/repository/deployment/server/jaggeryapps/portal/images/analyticsLogo.jpg";

    //Title Attributes
    public static final PDFont DEFAULT_TITLE_FONT = PDType1Font.HELVETICA_BOLD;

    public static final  float DEFAULT_TITLE_FONT_SIZE = 15;

    public static final Point DEFAULT_TITLE_COORDINATES = new Point(171, 678);


    //HeaderInfo Attributes
    public static final PDFont DEFAULT_HEADER_INFO_FONT = PDType1Font.HELVETICA_BOLD;

    public static final float DEFAULT_HEADER_INFO_FONT_SIZE = 10;

    public static final Point DEFAULT_HEADER_COORDINATES = new Point(40, 650);


    //Constants used in table
    public static final PDFont DEFAULT_TEXT_FONT = PDType1Font.HELVETICA;

    public static final float DEFAULT_FONT_SIZE = 7;

    public static final float DEFAULT_CELL_MARGIN = 4;

    public static final float DEFAULT_ROW_HEIGHT = 10 + DEFAULT_CELL_MARGIN;

    public static final float DEFAULT_TABLE_TOP_Y = 590f;

    public static final PDFont DEFAULT_TABLE_HEADER_FONT = PDType1Font.HELVETICA_BOLD;

    public static final float DEFAULT_TABLE_HEADER_FONT_SIZE = 8;

    public static final Color DEFAULT_TABLE_HEADER_BACKGROUND_COLOR = new Color(201, 202, 197);

    public static final Color DEFAULT_TABLE_FONT_COLOR = new Color(0, 0, 0);

    public static final Color DEFAULT_ALTERNATIVE_ROW_COLOR = new Color(240, 236, 224);

    public static final Color DEFAULT_TABLE_BODY_FILL_COLOR = new Color(255, 255, 255);


    //Constant used in PDFPageInfo
    public static final float DEFAULT_MARGIN = 40;

    public static final PDRectangle DEFAULT_PAGE_SIZE = PDPage.PAGE_SIZE_LETTER;

    //Constants used in Footer
    public static final Point DEFAULT_FOOTER_COORDINATES = new Point(40, 10);

}
