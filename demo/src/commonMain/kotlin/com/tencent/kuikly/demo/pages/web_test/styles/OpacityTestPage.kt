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
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Opacity 透明度渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同透明度值 (0, 0.2, 0.4, 0.6, 0.8, 1.0)
 * 2. 不同颜色的透明度
 * 3. 文本透明度
 * 4. 透明度叠加（父子元素）
 */
@Page("OpacityTestPage")
internal class OpacityTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 透明度梯度 ===
                Text {
                    attr {
                        text("1. 透明度梯度")
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
                        justifyContentSpaceAround()
                    }
                    // opacity = 0
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(0f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // opacity = 0.2
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(0.2f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0.2")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // opacity = 0.4
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(0.4f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0.4")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // opacity = 0.6
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(0.6f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0.6")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // opacity = 0.8
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(0.8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0.8")
                                fontSize(12f)
                                color(Color.WHITE)
                            }
                        }
                    }
                    // opacity = 1.0
                    View {
                        attr {
                            size(50f, 50f)
                            backgroundColor(0xFF1976D2)
                            opacity(1.0f)
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
                }

                // === Section 2: 不同颜色透明度 ===
                Text {
                    attr {
                        text("2. 不同颜色透明度")
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
                    // 红色渐变行
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.RED)
                                opacity(0.2f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.RED)
                                opacity(0.5f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.RED)
                                opacity(0.8f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.RED)
                                opacity(1.0f)
                            }
                        }
                    }
                    // 绿色渐变行
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                            marginTop(8f)
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.GREEN)
                                opacity(0.2f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.GREEN)
                                opacity(0.5f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.GREEN)
                                opacity(0.8f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.GREEN)
                                opacity(1.0f)
                            }
                        }
                    }
                    // 蓝色渐变行
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                            marginTop(8f)
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.BLUE)
                                opacity(0.2f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.BLUE)
                                opacity(0.5f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.BLUE)
                                opacity(0.8f)
                            }
                        }
                        View {
                            attr {
                                size(60f, 40f)
                                backgroundColor(Color.BLUE)
                                opacity(1.0f)
                            }
                        }
                    }
                }

                // === Section 3: 文本透明度 ===
                Text {
                    attr {
                        text("3. 文本透明度")
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
                    Text {
                        attr {
                            text("完全不透明文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            opacity(1.0f)
                        }
                    }
                    Text {
                        attr {
                            text("半透明文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            opacity(0.5f)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("轻透明文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            opacity(0.3f)
                            marginTop(4f)
                        }
                    }
                    Text {
                        attr {
                            text("几乎不可见文本")
                            fontSize(16f)
                            color(Color.BLACK)
                            opacity(0.1f)
                            marginTop(4f)
                        }
                    }
                }

                // === Section 4: 透明度叠加 ===
                Text {
                    attr {
                        text("4. 透明度叠加")
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
                        height(130f)
                    }
                    // 父元素半透明，子元素全部受影响
                    View {
                        attr {
                            size(200f, 100f)
                            backgroundColor(0xFF1976D2)
                            opacity(0.5f)
                            borderRadius(8f)
                            padding(all = 12f)
                        }
                        Text {
                            attr {
                                text("父 opacity=0.5")
                                fontSize(14f)
                                color(Color.WHITE)
                            }
                        }
                        View {
                            attr {
                                size(80f, 40f)
                                backgroundColor(Color.YELLOW)
                                borderRadius(4f)
                                marginTop(8f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("子元素")
                                    fontSize(12f)
                                    color(Color.BLACK)
                                }
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
