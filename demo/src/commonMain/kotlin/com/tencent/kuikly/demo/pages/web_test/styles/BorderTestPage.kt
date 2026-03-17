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

package com.tencent.kuikly.demo.pages.web_test.styles

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Border
import com.tencent.kuikly.core.base.BorderRectRadius
import com.tencent.kuikly.core.base.BorderStyle
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Border / BorderRadius 渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同边框宽度 (1px, 2px, 4px)
 * 2. 不同边框样式 (solid, dashed, dotted)
 * 3. 不同边框颜色
 * 4. 统一圆角 (0, 4, 8, 16, 30=圆形)
 * 5. 不等圆角 (BorderRectRadius)
 * 6. 边框 + 圆角组合
 * 7. 边框 + 背景色组合
 */
@Page("BorderTestPage")
internal class BorderTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 不同边框宽度 ===
                Text {
                    attr {
                        text("1. 不同边框宽度")
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
                    // 1px 边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(1f, BorderStyle.SOLID, Color.BLACK))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("1px")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 2px 边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(2f, BorderStyle.SOLID, Color.BLACK))
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("2px")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 4px 边框
                    View {
                        attr {
                            size(60f, 60f)
                            border(Border(4f, BorderStyle.SOLID, Color.BLACK))
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("4px")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                }

                // === Section 2: 不同边框样式 ===
                Text {
                    attr {
                        text("2. 不同边框样式")
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
                    // solid 实线
                    View {
                        attr {
                            size(80f, 60f)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF1976D2)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("solid")
                                fontSize(12f)
                                color(Color(0xFF1976D2))
                            }
                        }
                    }
                    // dashed 虚线
                    View {
                        attr {
                            size(80f, 60f)
                            border(Border(2f, BorderStyle.DASHED, Color(0xFFD32F2F)))
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("dashed")
                                fontSize(12f)
                                color(Color(0xFFD32F2F))
                            }
                        }
                    }
                    // dotted 点线
                    View {
                        attr {
                            size(80f, 60f)
                            border(Border(2f, BorderStyle.DOTTED, Color(0xFF388E3C)))
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("dotted")
                                fontSize(12f)
                                color(Color(0xFF388E3C))
                            }
                        }
                    }
                }

                // === Section 3: 不同边框颜色 ===
                Text {
                    attr {
                        text("3. 不同边框颜色")
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
                        flexWrapWrap()
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            border(Border(3f, BorderStyle.SOLID, Color.RED))
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            border(Border(3f, BorderStyle.SOLID, Color.BLUE))
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            border(Border(3f, BorderStyle.SOLID, Color.GREEN))
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            border(Border(3f, BorderStyle.SOLID, Color(0xFFFF9800)))
                            marginLeft(8f)
                        }
                    }
                    View {
                        attr {
                            size(50f, 50f)
                            border(Border(3f, BorderStyle.SOLID, Color(0xFF9C27B0)))
                            marginLeft(8f)
                        }
                    }
                }

                // === Section 4: 统一圆角 ===
                Text {
                    attr {
                        text("4. 统一圆角")
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
                            backgroundColor(0xFF42A5F5)
                        }
                    }
                    // 4px 圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF42A5F5)
                            borderRadius(4f)
                            marginLeft(12f)
                        }
                    }
                    // 8px 圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF42A5F5)
                            borderRadius(8f)
                            marginLeft(12f)
                        }
                    }
                    // 16px 圆角
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF42A5F5)
                            borderRadius(16f)
                            marginLeft(12f)
                        }
                    }
                    // 圆形 (30px = width/2)
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFF42A5F5)
                            borderRadius(30f)
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 5: 不等圆角 ===
                Text {
                    attr {
                        text("5. 不等圆角")
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
                    // 左上 + 右下
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(0xFFEF5350)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 20f,
                                    topRightCornerRadius = 0f,
                                    bottomLeftCornerRadius = 0f,
                                    bottomRightCornerRadius = 20f
                                )
                            )
                        }
                    }
                    // 右上 + 左下
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(0xFF66BB6A)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 0f,
                                    topRightCornerRadius = 20f,
                                    bottomLeftCornerRadius = 20f,
                                    bottomRightCornerRadius = 0f
                                )
                            )
                            marginLeft(12f)
                        }
                    }
                    // 仅左上大圆角
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(0xFFFFA726)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 35f,
                                    topRightCornerRadius = 0f,
                                    bottomLeftCornerRadius = 0f,
                                    bottomRightCornerRadius = 0f
                                )
                            )
                            marginLeft(12f)
                        }
                    }
                    // 四角不同
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(0xFF7E57C2)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 5f,
                                    topRightCornerRadius = 15f,
                                    bottomLeftCornerRadius = 25f,
                                    bottomRightCornerRadius = 35f
                                )
                            )
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 6: 边框 + 圆角组合 ===
                Text {
                    attr {
                        text("6. 边框+圆角组合")
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
                    View {
                        attr {
                            size(70f, 70f)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF1976D2)))
                            borderRadius(8f)
                        }
                    }
                    View {
                        attr {
                            size(70f, 70f)
                            border(Border(2f, BorderStyle.DASHED, Color(0xFFD32F2F)))
                            borderRadius(16f)
                            marginLeft(12f)
                        }
                    }
                    View {
                        attr {
                            size(70f, 70f)
                            border(Border(3f, BorderStyle.SOLID, Color(0xFF388E3C)))
                            borderRadius(35f)
                            marginLeft(12f)
                        }
                    }
                }

                // === Section 7: 边框 + 背景色组合 ===
                Text {
                    attr {
                        text("7. 边框+背景色")
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
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(0xFFE3F2FD)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF1976D2)))
                            borderRadius(8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("蓝底")
                                fontSize(12f)
                                color(Color(0xFF1976D2))
                            }
                        }
                    }
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(0xFFFCE4EC)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFFC62828)))
                            borderRadius(8f)
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("红底")
                                fontSize(12f)
                                color(Color(0xFFC62828))
                            }
                        }
                    }
                    View {
                        attr {
                            size(80f, 60f)
                            backgroundColor(0xFFE8F5E9)
                            border(Border(2f, BorderStyle.SOLID, Color(0xFF2E7D32)))
                            borderRadius(8f)
                            marginLeft(12f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("绿底")
                                fontSize(12f)
                                color(Color(0xFF2E7D32))
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
