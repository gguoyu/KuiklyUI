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
import com.tencent.kuikly.core.base.BorderRectRadius
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * KRView 基础渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同尺寸的 View
 * 2. 不同背景色的 View
 * 3. 不同圆角的 View
 * 4. 边框样式的 View
 * 5. 渐变背景的 View
 * 6. 嵌套布局的 View
 * 7. Flex 布局（行/列）
 */
@Page("KRViewTestPage")
internal class KRViewTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 不同尺寸 ===
                Text {
                    attr {
                        text("1. 不同尺寸")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    // 小尺寸
                    View {
                        attr {
                            size(40f, 40f)
                            backgroundColor(0xFF4CAF50)
                        }
                    }
                    // 中尺寸
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(0xFF2196F3)
                            marginLeft(12f)
                        }
                    }
                    // 大尺寸
                    View {
                        attr {
                            size(120f, 80f)
                            backgroundColor(0xFFFF9800)
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 2: 不同背景色 ===
                Text {
                    attr {
                        text("2. 不同背景色")
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
                        padding(all = 16f)
                        flexWrapWrap()
                    }
                    View {
                        attr {
                            size(60f, 40f)
                            backgroundColor(Color.RED)
                        }
                    }
                    View {
                        attr {
                            size(60f, 40f)
                            backgroundColor(Color.GREEN)
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(60f, 40f)
                            backgroundColor(Color.BLUE)
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(60f, 40f)
                            backgroundColor(Color.YELLOW)
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(60f, 40f)
                            backgroundColor(0xFF9C27B0)
                            marginLeft(8f)
                        }
                    }
                }

                // === Section 3: 不同圆角 ===
                Text {
                    attr {
                        text("3. 不同圆角")
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
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    // 无圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF00BCD4)
                        }
                    }
                    // 小圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFFE91E63)
                            borderRadius(8f)
                            marginLeft(12f)
                        }
                    }
                    // 大圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF673AB7)
                            borderRadius(20f)
                            marginLeft(12f)
                        }
                    }
                    // 完全圆形
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFFFF5722)
                            borderRadius(30f)
                            marginLeft(12f)
                        }
                    }
                    // 不等圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF795548)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 20f,
                                    topRightCornerRadius = 0f,
                                    bottomLeftCornerRadius = 0f,
                                    bottomRightCornerRadius = 20f
                                )
                            )
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 4: 边框样式 ===
                Text {
                    attr {
                        text("4. 边框样式")
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
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    // 实线边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(2f, BorderStyle.SOLID, Color.BLACK))
                        }
                    }
                    // 虚线边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(2f, BorderStyle.DASHED, Color.RED))
                            marginLeft(12f)
                        }
                    }
                    // 点线边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(2f, BorderStyle.DOTTED, Color.BLUE))
                            marginLeft(12f)
                        }
                    }
                    // 边框 + 圆角
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF4CAF50)))
                            borderRadius(12f)
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 5: 渐变背景 ===
                Text {
                    attr {
                        text("5. 渐变背景")
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
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    // 水平渐变
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFF4ECDC4), 1f)
                            )
                        }
                    }
                    // 垂直渐变
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM,
                                ColorStop(Color(0xFF667EEA), 0f),
                                ColorStop(Color(0xFF764BA2), 1f)
                            )
                            marginLeft(12f)
                        }
                    }
                    // 对角渐变（多色）
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_RIGHT,
                                ColorStop(Color(0xFFF093FB), 0f),
                                ColorStop(Color(0xFFF5576C), 0.5f),
                                ColorStop(Color(0xFF4FACFE), 1f)
                            )
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 6: 嵌套布局 ===
                Text {
                    attr {
                        text("6. 嵌套布局")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        margin(all = 16f)
                        padding(all = 12f)
                        backgroundColor(0xFFF5F5F5)
                        borderRadius(8f)
                    }
                    // 父容器 - 垂直方向
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                        }
                        View {
                            attr {
                                size(80f, 80f)
                                backgroundColor(0xFF42A5F5)
                                borderRadius(8f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("A")
                                    fontSize(20f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                        View {
                            attr {
                                size(80f, 80f)
                                backgroundColor(0xFFEF5350)
                                borderRadius(8f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("B")
                                    fontSize(20f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                        View {
                            attr {
                                size(80f, 80f)
                                backgroundColor(0xFF66BB6A)
                                borderRadius(8f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("C")
                                    fontSize(20f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // === Section 7: Flex 布局 ===
                Text {
                    attr {
                        text("7. Flex 布局")
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
                        margin(all = 16f)
                        height(60f)
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFFE53935)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("1")
                                color(Color.WHITE)
                                fontSize(16f)
                            }
                        }
                    }
                    View {
                        attr {
                            flex(2f)
                            backgroundColor(0xFF1E88E5)
                            allCenter()
                            marginLeft(4f)
                        }
                        Text {
                            attr {
                                text("2")
                                color(Color.WHITE)
                                fontSize(16f)
                            }
                        }
                    }
                    View {
                        attr {
                            flex(1f)
                            backgroundColor(0xFF43A047)
                            allCenter()
                            marginLeft(4f)
                        }
                        Text {
                            attr {
                                text("1")
                                color(Color.WHITE)
                                fontSize(16f)
                            }
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
