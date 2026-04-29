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
import com.tencent.kuikly.core.base.ColorStop
import com.tencent.kuikly.core.base.Direction
import com.tencent.kuikly.core.base.Rotate
import com.tencent.kuikly.core.base.Scale
import com.tencent.kuikly.core.base.Skew
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.Image
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Transform + Mask + TextStroke 渲染验证测试页面
 *
 * 测试覆盖：
 * 1. Transform - Rotation (rotate)
 * 2. Transform - Scale (scale)
 * 3. Transform - Skew (skew)
 * 4. Transform - Anchor (anchor + rotate)
 * 5. Mask Gradient on Image (maskLinearGradient)
 * 6. Text Stroke (textStroke)
 * 7. Semi-transparent Background (alpha color)
 */
@Page("TransformMaskTestPage")
internal class TransformMaskTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: Transform - Rotation ===
                Text {
                    attr {
                        text("Transform - Rotation")
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
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(0xFF42A5F5)
                            transform(rotate = Rotate(45f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Rotated 45")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 2: Transform - Scale ===
                Text {
                    attr {
                        text("Transform - Scale")
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
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(0xFF7E57C2)
                            transform(scale = Scale(1.5f, 0.8f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Scaled")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 3: Transform - Skew ===
                Text {
                    attr {
                        text("Transform - Skew")
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
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(0xFF26C6DA)
                            transform(skew = Skew(15f, 0f))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Skewed")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 4: Transform - Anchor ===
                Text {
                    attr {
                        text("Transform - Anchor")
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
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(0xFFEF5350)
                            transform(
                                rotate = Rotate(30f),
                                anchor = Anchor(0f, 0f)
                            )
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Anchored")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // === Section 5: Mask Gradient on Image ===
                Text {
                    attr {
                        text("Mask Gradient on Image")
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
                        alignItemsCenter()
                    }
                    Image {
                        attr {
                            size(200f, 100f)
                            src("https://via.placeholder.com/200x100/2196F3/ffffff?text=Masked")
                            maskLinearGradient(
                                Direction.TO_RIGHT,
                                ColorStop(Color.BLACK, 1f),
                                ColorStop(Color.BLACK, 0f)
                            )
                        }
                    }
                }

                // === Section 6: Text Stroke ===
                Text {
                    attr {
                        text("Text Stroke")
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
                        alignItemsCenter()
                    }
                    Text {
                        attr {
                            text("Stroked Text")
                            fontSize(28f)
                            color(Color.WHITE)
                            textStroke(Color.RED, 2f)
                        }
                    }
                }

                // === Section 7: Semi-transparent Background ===
                Text {
                    attr {
                        text("Semi-transparent Background")
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
                        alignItemsCenter()
                    }
                    View {
                        attr {
                            size(160f, 60f)
                            backgroundColor(Color(0x80FF0000))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("Semi-transparent")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                    }
                }

                // Bottom spacing
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
