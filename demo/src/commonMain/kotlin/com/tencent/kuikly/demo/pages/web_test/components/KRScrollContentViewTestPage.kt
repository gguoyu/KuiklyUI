/*
 * Tencent is pleased to support the open source community by making KuiklyUI
 * available.
 * Copyright (C) 2025 Tencent. All rights reserved.
 * Licensed under the License of KuiklyUI;
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://github.com/Tencent-TDS/KuiklyUI/blob/main/LICENSE
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.tencent.kuikly.demo.pages.web_test.components

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.KRNestedScrollMode
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Scroller
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRScrollContentView 婊氬姩鍐呭楠岃瘉娴嬭瘯椤甸潰
 *
 * Scroller 缁勪欢鍐呴儴鑷姩鍒涘缓 KRScrollContentView 浣滀负瀛愬鍣ㄣ€?
 * 鎵€鏈夋坊鍔犲埌 Scroller 鐨勫瓙瑙嗗浘浼氳嚜鍔ㄦ斁鍏?KRScrollContentView 涓€?
 *
 * 娴嬭瘯瑕嗙洊锛?
 * 1. 鍨傜洿婊氬姩锛堥粯璁?flexDirection = column锛?
 * 2. 姘村钩婊氬姩锛坒lexDirectionRow锛?
 * 3. 闀垮唴瀹圭旱鍚戞粴鍔?
 * 4. 娣峰悎鍐呭婊氬姩锛堟枃鏈?+ 鑹插潡锛?
 * 5. 宓屽婊氬姩瀹瑰櫒甯冨眬楠岃瘉
 */
@Page("KRScrollContentViewTestPage")
internal class KRScrollContentViewTestPage : Pager() {

    companion object {
        // 鐢ㄤ簬鐢熸垚娴嬭瘯鑹插潡鐨勯鑹插垪琛?
        private val COLORS = listOf(
            0xFFE53935L, 0xFF1E88E5L, 0xFF43A047L, 0xFFFB8C00L,
            0xFF8E24AAL, 0xFF00ACC1L, 0xFFD81B60L, 0xFF3949ABL,
            0xFF00897BL, 0xFFE65100L, 0xFF6D4C41L, 0xFF546E7AL,
            0xFFC0CA33L, 0xFF7CB342L, 0xFF5E35B1L, 0xFFFF6F00L,
            0xFF1565C0L, 0xFF2E7D32L, 0xFFAD1457L, 0xFFEF6C00L
        )
    }

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 鍨傜洿婊氬姩 ===
                Text {
                    attr {
                        text("1. 鍨傜洿婊氬姩")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(200f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Scroller {
                        attr {
                            flex(1f)
                            scrollEnable(true)
                            showScrollerIndicator(true)
                        }
                        // 鐢熸垚瓒呭嚭瀹瑰櫒楂樺害鐨勫唴瀹?
                        for (i in 1..10) {
                            View {
                                attr {
                                    height(50f)
                                    margin(left = 8f, top = 4f, right = 8f)
                                    backgroundColor(Color(COLORS[(i - 1) % COLORS.size]))
                                    borderRadius(6f)
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        text("鍨傜洿椤?$i")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                        // 搴曢儴闂磋窛
                        View {
                            attr {
                                height(8f)
                            }
                        }
                    }
                }

                // === Section 2: 姘村钩婊氬姩 ===
                Text {
                    attr {
                        text("2. 姘村钩婊氬姩")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(80f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Scroller {
                        attr {
                            flex(1f)
                            flexDirectionRow()
                            scrollEnable(true)
                            showScrollerIndicator(true)
                        }
                        // 鐢熸垚瓒呭嚭瀹瑰櫒瀹藉害鐨勫唴瀹?
                        for (i in 1..15) {
                            View {
                                attr {
                                    size(80f, 60f)
                                    margin(left = 8f, top = 10f)
                                    backgroundColor(Color(COLORS[(i - 1) % COLORS.size]))
                                    borderRadius(6f)
                                    allCenter()
                                }
                                Text {
                                    attr {
                                        text("H$i")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                        // 鍙充晶闂磋窛
                        View {
                            attr {
                                size(8f, 1f)
                            }
                        }
                    }
                }

                // === Section 3: 闀垮唴瀹圭旱鍚戞粴鍔?===
                Text {
                    attr {
                        text("3. Scroll content advanced section")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(180f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Scroller {
                        attr {
                            flex(1f)
                            scrollEnable(true)
                        }
                        for (i in 1..20) {
                            View {
                                attr {
                                    flexDirectionRow()
                                    height(36f)
                                    margin(left = 8f, top = 4f, right = 8f)
                                    alignItemsCenter()
                                    backgroundColor(
                                        if (i % 2 == 0) Color(0xFFE3F2FD) else Color(0xFFE8F5E9)
                                    )
                                    borderRadius(4f)
                                    padding(left = 8f)
                                }
                                Text {
                                    attr {
                                        text("$i.")
                                        fontSize(12f)
                                        fontWeightBold()
                                        color(Color(0xFF666666))
                                    }
                                }
                                Text {
                                    attr {
                                        text("闀垮垪琛ㄦ粴鍔ㄩ」 Item $i")
                                        fontSize(13f)
                                        color(Color(0xFF333333))
                                        marginLeft(8f)
                                    }
                                }
                            }
                        }
                        View {
                            attr {
                                height(8f)
                            }
                        }
                    }
                }

                // === Section 4: 娣峰悎鍐呭婊氬姩 ===
                Text {
                    attr {
                        text("4. 娣峰悎鍐呭婊氬姩")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(left = 16f, top = 8f, right = 16f)
                        height(200f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    Scroller {
                        attr {
                            flex(1f)
                            scrollEnable(true)
                        }
                        // 鏍囬鍖哄煙
                        View {
                            attr {
                                padding(all = 12f)
                                backgroundColor(Color(0xFF1565C0))
                                margin(left = 8f, top = 8f, right = 8f)
                                borderRadius(6f)
                            }
                            Text {
                                attr {
                                    text("娣峰悎鍐呭鏍囬鍖哄煙")
                                    fontSize(16f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                            Text {
                                attr {
                                    text("Complex scroll content description")
                                    fontSize(12f)
                                    color(Color(0xCCFFFFFF))
                                    marginTop(4f)
                                }
                            }
                        }
                        // 鑹插潡缃戞牸
                        View {
                            attr {
                                flexDirectionRow()
                                flexWrapWrap()
                                padding(left = 8f, top = 8f, right = 8f)
                            }
                            for (i in 1..8) {
                                View {
                                    attr {
                                        size(75f, 60f)
                                        margin(all = 4f)
                                        backgroundColor(Color(COLORS[(i - 1) % COLORS.size]))
                                        borderRadius(6f)
                                        allCenter()
                                    }
                                    Text {
                                        attr {
                                            text("鍧?i")
                                            fontSize(13f)
                                            color(Color.WHITE)
                                            fontWeightBold()
                                        }
                                    }
                                }
                            }
                        }
                        // 搴曢儴鏂囨湰鍒楄〃
                        for (i in 1..6) {
                            View {
                                attr {
                                    flexDirectionRow()
                                    height(40f)
                                    margin(left = 8f, top = 4f, right = 8f)
                                    alignItemsCenter()
                                    padding(left = 12f)
                                    backgroundColor(Color(0xFFEEEEEE))
                                    borderRadius(4f)
                                }
                                View {
                                    attr {
                                        size(8f, 8f)
                                        backgroundColor(Color(COLORS[(i - 1) % COLORS.size]))
                                        borderRadius(4f)
                                    }
                                }
                                Text {
                                    attr {
                                        text("搴曢儴淇℃伅琛?$i")
                                        fontSize(13f)
                                        color(Color(0xFF333333))
                                        marginLeft(8f)
                                    }
                                }
                            }
                        }
                        View {
                            attr {
                                height(12f)
                            }
                        }
                    }
                }

                // === Section 5: 宓屽甯冨眬楠岃瘉 ===
                Text {
                    attr {
                        text("5. 宓屽甯冨眬楠岃瘉")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        margin(left = 16f, top = 8f, right = 16f)
                        height(150f)
                    }
                    // 宸︿晶鍨傜洿婊氬姩
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFFE8EAF6)
                            borderRadius(8f)
                            marginRight(8f)
                        }
                        Text {
                            attr {
                                text("宸︿晶婊氬姩")
                                fontSize(11f)
                                color(Color(0xFF333333))
                                marginLeft(8f)
                                marginTop(4f)
                            }
                        }
                        Scroller {
                            attr {
                                flex(1f)
                                scrollEnable(true)
                                nestedScroll(KRNestedScrollMode.SELF_FIRST, KRNestedScrollMode.SELF_FIRST)
                            }
                            for (i in 1..8) {
                                View {
                                    attr {
                                        height(35f)
                                        margin(left = 4f, top = 3f, right = 4f)
                                        backgroundColor(Color(COLORS[(i - 1) % COLORS.size]))
                                        borderRadius(4f)
                                        allCenter()
                                    }
                                    Text {
                                        attr {
                                            text("L$i")
                                            fontSize(12f)
                                            color(Color.WHITE)
                                        }
                                    }
                                }
                            }
                            View { attr { height(4f) } }
                        }
                    }
                    // 鍙充晶鍨傜洿婊氬姩
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFFFCE4EC)
                            borderRadius(8f)
                        }
                        Text {
                            attr {
                                text("鍙充晶婊氬姩")
                                fontSize(11f)
                                color(Color(0xFF333333))
                                marginLeft(8f)
                                marginTop(4f)
                            }
                        }
                        Scroller {
                            attr {
                                flex(1f)
                                scrollEnable(true)
                                nestedScroll(KRNestedScrollMode.PARENT_FIRST, KRNestedScrollMode.SELF_FIRST)
                            }
                            for (i in 1..8) {
                                View {
                                    attr {
                                        height(35f)
                                        margin(left = 4f, top = 3f, right = 4f)
                                        backgroundColor(Color(COLORS[(i + 9) % COLORS.size]))
                                        borderRadius(4f)
                                        allCenter()
                                    }
                                    Text {
                                        attr {
                                            text("R$i")
                                            fontSize(12f)
                                            color(Color.WHITE)
                                        }
                                    }
                                }
                            }
                            View { attr { height(4f) } }
                        }
                    }
                }

                // 搴曢儴闂磋窛
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
