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
import com.tencent.kuikly.core.base.Anchor
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.Rotate
import com.tencent.kuikly.core.base.Scale
import com.tencent.kuikly.core.base.Skew
import com.tencent.kuikly.core.base.Translate
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Transform 变换渲染验证测试页面
 *
 * 测试覆盖：
 * 1. Rotate 旋转 (0°, 45°, 90°, 180°)
 * 2. Scale 缩放 (0.5x, 1x, 1.5x, 2x)
 * 3. Translate 平移
 * 4. Skew 倾斜
 * 5. 组合变换 (rotate + scale)
 */
@Page("TransformTestPage")
internal class TransformTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: Rotate 旋转 ===
                Text {
                    attr {
                        text("1. Rotate 旋转")
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
                        padding(all = 24f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        height(120f)
                    }
                    // 0°
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF42A5F5)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 45°
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFFEF5350)
                            transform(rotate = Rotate(45f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("45°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 90°
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF66BB6A)
                            transform(rotate = Rotate(90f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("90°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 180°
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFFFFA726)
                            transform(rotate = Rotate(180f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("180°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 2: Scale 缩放 ===
                Text {
                    attr {
                        text("2. Scale 缩放")
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
                        padding(all = 24f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        height(120f)
                    }
                    // 0.5x
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF7E57C2)
                            transform(scale = Scale(0.5f, 0.5f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0.5")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 1x (原始)
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF7E57C2)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("1.0")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 1.5x
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF7E57C2)
                            transform(scale = Scale(1.5f, 1.5f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("1.5")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // X 方向拉伸
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF7E57C2)
                            transform(scale = Scale(2f, 1f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("2,1")
                                fontSize(10f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 3: Skew 倾斜 ===
                Text {
                    attr {
                        text("3. Skew 倾斜")
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
                        padding(all = 24f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        height(120f)
                    }
                    // 水平倾斜 -15°
                    View {
                        attr {
                            size(60f, 50f)
                            backgroundColor(0xFF26C6DA)
                            transform(skew = Skew(-15f, 0f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("-15°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 无倾斜
                    View {
                        attr {
                            size(60f, 50f)
                            backgroundColor(0xFF26C6DA)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 水平倾斜 15°
                    View {
                        attr {
                            size(60f, 50f)
                            backgroundColor(0xFF26C6DA)
                            transform(skew = Skew(15f, 0f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("15°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // 垂直倾斜 10°
                    View {
                        attr {
                            size(60f, 50f)
                            backgroundColor(0xFF26C6DA)
                            transform(skew = Skew(0f, 10f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("v10°")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 4: Translate 平移 ===
                Text {
                    attr {
                        text("4. Translate 平移")
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
                        height(120f)
                    }
                    // 参考位置 (虚线框)
                    View {
                        attr {
                            size(60f, 60f)
                            border(com.tencent.kuikly.core.base.Border(1f, com.tencent.kuikly.core.base.BorderStyle.DASHED, Color(0xFFBDBDBD)))
                            absolutePosition(left = 16f, top = 20f)
                        }
                    }
                    // 平移后的元素
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(0xFFFF7043)
                            transform(translate = Translate(0f, 0f, offsetX = 30f, offsetY = 20f))
                            absolutePosition(left = 16f, top = 20f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("移动")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 5: 组合变换 ===
                Text {
                    attr {
                        text("5. 组合变换")
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
                        padding(all = 24f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                        height(140f)
                    }
                    // rotate + scale
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFFEC407A)
                            transform(
                                rotate = Rotate(30f),
                                scale = Scale(1.2f, 1.2f)
                            )
                            allCenter()
                        }
                        Text {
                            attr {
                                text("R+S")
                                fontSize(10f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // rotate + skew
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF5C6BC0)
                            transform(
                                rotate = Rotate(15f),
                                skew = Skew(10f, 0f)
                            )
                            allCenter()
                        }
                        Text {
                            attr {
                                text("R+K")
                                fontSize(10f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // scale + skew with anchor
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF26A69A)
                            transform(
                                scale = Scale(1.3f, 1.3f),
                                skew = Skew(-10f, 0f),
                                anchor = Anchor(0.5f, 0.5f)
                            )
                            allCenter()
                        }
                        Text {
                            attr {
                                text("S+K")
                                fontSize(10f)
                                color(Color.WHITE)
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
