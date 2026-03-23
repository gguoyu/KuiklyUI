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
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Scroller
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRScrollContentView 滚动内容验证测试页面
 *
 * Scroller 组件内部自动创建 KRScrollContentView 作为子容器。
 * 所有添加到 Scroller 的子视图会自动放入 KRScrollContentView 中。
 *
 * 测试覆盖：
 * 1. 垂直滚动（默认 flexDirection = column）
 * 2. 水平滚动（flexDirectionRow）
 * 3. 长内容纵向滚动
 * 4. 混合内容滚动（文本 + 色块）
 * 5. 嵌套滚动容器布局验证
 */
@Page("KRScrollContentViewTestPage")
internal class KRScrollContentViewTestPage : Pager() {

    companion object {
        // 用于生成测试色块的颜色列表
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

                // === Section 1: 垂直滚动 ===
                Text {
                    attr {
                        text("1. 垂直滚动")
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
                        // 生成超出容器高度的内容
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
                                        text("垂直项 $i")
                                        fontSize(14f)
                                        color(Color.WHITE)
                                        fontWeightBold()
                                    }
                                }
                            }
                        }
                        // 底部间距
                        View {
                            attr {
                                height(8f)
                            }
                        }
                    }
                }

                // === Section 2: 水平滚动 ===
                Text {
                    attr {
                        text("2. 水平滚动")
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
                        // 生成超出容器宽度的内容
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
                        // 右侧间距
                        View {
                            attr {
                                size(8f, 1f)
                            }
                        }
                    }
                }

                // === Section 3: 长内容纵向滚动 ===
                Text {
                    attr {
                        text("3. 长内容滚动")
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
                                        text("长列表滚动项 Item $i")
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

                // === Section 4: 混合内容滚动 ===
                Text {
                    attr {
                        text("4. 混合内容滚动")
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
                        // 标题区域
                        View {
                            attr {
                                padding(all = 12f)
                                backgroundColor(Color(0xFF1565C0))
                                margin(left = 8f, top = 8f, right = 8f)
                                borderRadius(6f)
                            }
                            Text {
                                attr {
                                    text("混合内容标题区域")
                                    fontSize(16f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                            Text {
                                attr {
                                    text("这是一段说明文本，描述混合内容区域的功能。")
                                    fontSize(12f)
                                    color(Color(0xCCFFFFFF))
                                    marginTop(4f)
                                }
                            }
                        }
                        // 色块网格
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
                                            text("块$i")
                                            fontSize(13f)
                                            color(Color.WHITE)
                                            fontWeightBold()
                                        }
                                    }
                                }
                            }
                        }
                        // 底部文本列表
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
                                        text("底部信息行 $i")
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

                // === Section 5: 嵌套布局验证 ===
                Text {
                    attr {
                        text("5. 嵌套布局验证")
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
                    // 左侧垂直滚动
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFFE8EAF6)
                            borderRadius(8f)
                            marginRight(8f)
                        }
                        Text {
                            attr {
                                text("左侧滚动")
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
                    // 右侧垂直滚动
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFFFCE4EC)
                            borderRadius(8f)
                        }
                        Text {
                            attr {
                                text("右侧滚动")
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

                // 底部间距
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
