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
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRListView 列表渲染验证测试页面（静态版）
 *
 * 测试覆盖：
 * 1. 固定数量的列表项（硬编码 10 项）
 * 2. 列表项包含标题和副标题
 * 3. 不同样式的列表项（交替背景色）
 * 4. 列表头部标题
 *
 * 注意：此页面为 L0 静态测试，不涉及滚动操作
 *       滚动测试在 L2-complex/ListScrollTestPage 中进行
 */
@Page("KRListViewTestPage")
internal class KRListViewTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            // 标题
            View {
                attr {
                    height(50f)
                    backgroundColor(0xFF1976D2)
                    allCenter()
                }
                Text {
                    attr {
                        text("列表渲染测试")
                        fontSize(18f)
                        fontWeightBold()
                        color(Color.WHITE)
                    }
                }
            }

            // 列表
            List {
                attr {
                    flex(1f)
                }

                // 列表项 1
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(Color.WHITE)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF4CAF50)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("1")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 1")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第一个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 2
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(0xFFFAFAFA)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF2196F3)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("2")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 2")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第二个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 3
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(Color.WHITE)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFFFF9800)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("3")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 3")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第三个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 4
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(0xFFFAFAFA)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFFE91E63)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("4")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 4")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第四个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 5
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(Color.WHITE)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF9C27B0)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("5")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 5")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第五个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 6
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(0xFFFAFAFA)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF00BCD4)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("6")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 6")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第六个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 7
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(Color.WHITE)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF795548)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("7")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 7")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第七个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 8
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(0xFFFAFAFA)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF607D8B)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("8")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 8")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第八个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 9
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(Color.WHITE)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFFFF5722)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("9")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 9")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第九个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 列表项 10
                View {
                    attr {
                        flexDirectionRow()
                        alignItemsCenter()
                        height(60f)
                        padding(left = 16f, right = 16f)
                        backgroundColor(0xFFFAFAFA)
                        border(Border(0.5f, BorderStyle.SOLID, Color(0xFFE0E0E0)))
                    }
                    View {
                        attr {
                            size(36f, 36f)
                            borderRadius(18f)
                            backgroundColor(0xFF3F51B5)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("10")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    View {
                        attr {
                            marginLeft(12f)
                            flex(1f)
                        }
                        Text {
                            attr {
                                text("列表项 10")
                                fontSize(16f)
                                color(Color.BLACK)
                            }
                        }
                        Text {
                            attr {
                                text("这是第十个列表项的描述文字")
                                fontSize(12f)
                                color(0xFF999999)
                                marginTop(2f)
                            }
                        }
                    }
                }

                // 底部间距
                View {
                    attr {
                        height(20f)
                    }
                }
            }
        }
    }
}
