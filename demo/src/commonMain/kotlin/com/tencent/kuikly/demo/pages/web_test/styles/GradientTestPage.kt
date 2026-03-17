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
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Gradient 渐变渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 水平渐变 (TO_LEFT, TO_RIGHT)
 * 2. 垂直渐变 (TO_TOP, TO_BOTTOM)
 * 3. 对角渐变 (TO_TOP_LEFT, TO_TOP_RIGHT, TO_BOTTOM_LEFT, TO_BOTTOM_RIGHT)
 * 4. 多色渐变 (3色, 4色)
 * 5. 渐变 + 圆角组合
 */
@Page("GradientTestPage")
internal class GradientTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 水平渐变 ===
                Text {
                    attr {
                        text("1. 水平渐变")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(all = 16f)
                    }
                    // TO_RIGHT
                    View {
                        attr {
                            height(50f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFF4ECDC4), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("TO_RIGHT")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    // TO_LEFT
                    View {
                        attr {
                            height(50f)
                            marginTop(8f)
                            backgroundLinearGradient(
                                Direction.TO_LEFT,
                                ColorStop(Color(0xFFFF6B6B), 0f),
                                ColorStop(Color(0xFF4ECDC4), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("TO_LEFT")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // === Section 2: 垂直渐变 ===
                Text {
                    attr {
                        text("2. 垂直渐变")
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
                    }
                    // TO_BOTTOM
                    View {
                        attr {
                            flex(1f)
                            height(100f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM,
                                ColorStop(Color(0xFF667EEA), 0f),
                                ColorStop(Color(0xFF764BA2), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("TO_BOTTOM")
                                fontSize(12f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    // TO_TOP
                    View {
                        attr {
                            flex(1f)
                            height(100f)
                            marginLeft(8f)
                            backgroundLinearGradient(
                                Direction.TO_TOP,
                                ColorStop(Color(0xFF667EEA), 0f),
                                ColorStop(Color(0xFF764BA2), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("TO_TOP")
                                fontSize(12f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // === Section 3: 对角渐变 ===
                Text {
                    attr {
                        text("3. 对角渐变")
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
                        flexWrapWrap()
                        padding(all = 16f)
                    }
                    // TO_BOTTOM_RIGHT
                    View {
                        attr {
                            size(160f, 80f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_RIGHT,
                                ColorStop(Color(0xFFF093FB), 0f),
                                ColorStop(Color(0xFFF5576C), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("↘")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // TO_BOTTOM_LEFT
                    View {
                        attr {
                            size(160f, 80f)
                            marginLeft(8f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_LEFT,
                                ColorStop(Color(0xFF43E97B), 0f),
                                ColorStop(Color(0xFF38F9D7), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("↙")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // TO_TOP_RIGHT
                    View {
                        attr {
                            size(160f, 80f)
                            marginTop(8f)
                            backgroundLinearGradient(
                                Direction.TO_TOP_RIGHT,
                                ColorStop(Color(0xFFFA709A), 0f),
                                ColorStop(Color(0xFFFEE140), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("↗")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // TO_TOP_LEFT
                    View {
                        attr {
                            size(160f, 80f)
                            marginTop(8f)
                            marginLeft(8f)
                            backgroundLinearGradient(
                                Direction.TO_TOP_LEFT,
                                ColorStop(Color(0xFF30CFD0), 0f),
                                ColorStop(Color(0xFF330867), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("↖")
                                fontSize(20f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 4: 多色渐变 ===
                Text {
                    attr {
                        text("4. 多色渐变")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(12f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        padding(all = 16f)
                    }
                    // 三色渐变
                    View {
                        attr {
                            height(50f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF0000), 0f),
                                ColorStop(Color(0xFF00FF00), 0.5f),
                                ColorStop(Color(0xFF0000FF), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("三色渐变")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                    // 四色渐变（彩虹）
                    View {
                        attr {
                            height(50f)
                            marginTop(8f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFF0000), 0f),
                                ColorStop(Color(0xFFFFFF00), 0.33f),
                                ColorStop(Color(0xFF00FF00), 0.66f),
                                ColorStop(Color(0xFF0000FF), 1f)
                            )
                            borderRadius(4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("四色渐变")
                                fontSize(14f)
                                color(Color.WHITE)
                                fontWeightBold()
                            }
                        }
                    }
                }

                // === Section 5: 渐变 + 圆角组合 ===
                Text {
                    attr {
                        text("5. 渐变+圆角组合")
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
                        justifyContentSpaceAround()
                    }
                    // 圆角矩形渐变
                    View {
                        attr {
                            size(100f, 60f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFF6A11CB), 0f),
                                ColorStop(Color(0xFF2575FC), 1f)
                            )
                            borderRadius(12f)
                        }
                    }
                    // 药丸形渐变
                    View {
                        attr {
                            size(120f, 40f)
                            backgroundLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color(0xFFFC5C7D), 0f),
                                ColorStop(Color(0xFF6A82FB), 1f)
                            )
                            borderRadius(20f)
                        }
                    }
                    // 圆形渐变
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundLinearGradient(
                                Direction.TO_BOTTOM_RIGHT,
                                ColorStop(Color(0xFFFF512F), 0f),
                                ColorStop(Color(0xFFDD2476), 1f)
                            )
                            borderRadius(30f)
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
