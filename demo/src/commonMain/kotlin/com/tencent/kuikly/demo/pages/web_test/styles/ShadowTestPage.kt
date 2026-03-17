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
import com.tencent.kuikly.core.base.BoxShadow
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Shadow 阴影渲染验证测试页面
 *
 * 测试覆盖：
 * 1. 不同阴影模糊半径 (0, 5, 10, 20)
 * 2. 不同阴影偏移量
 * 3. 不同阴影颜色
 * 4. 阴影 + 圆角组合
 * 5. 阴影强度梯度
 */
@Page("ShadowTestPage")
internal class ShadowTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color(0xFFF5F5F5))
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: 不同模糊半径 ===
                Text {
                    attr {
                        text("1. 不同模糊半径")
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
                    // 无模糊
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 0f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0")
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 小模糊
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 5f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("5")
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 中模糊
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 10f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("10")
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 大模糊
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 20f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("20")
                                fontSize(14f)
                                color(Color.BLACK)
                            }
                        }
                    }
                }

                // === Section 2: 不同偏移量 ===
                Text {
                    attr {
                        text("2. 不同偏移量")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 20f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                    }
                    // 无偏移
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(0f, 0f, 8f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("0,0")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 右下偏移
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(5f, 5f, 8f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("5,5")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 大偏移
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(10f, 10f, 8f, Color(0xFF000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("10,10")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                }

                // === Section 3: 不同阴影颜色 ===
                Text {
                    attr {
                        text("3. 不同阴影颜色")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 20f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                    }
                    // 蓝色阴影
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 10f, Color(0xFF1976D2)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("蓝")
                                fontSize(14f)
                                color(Color(0xFF1976D2))
                            }
                        }
                    }
                    // 红色阴影
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 10f, Color(0xFFD32F2F)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("红")
                                fontSize(14f)
                                color(Color(0xFFD32F2F))
                            }
                        }
                    }
                    // 绿色阴影
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 10f, Color(0xFF388E3C)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("绿")
                                fontSize(14f)
                                color(Color(0xFF388E3C))
                            }
                        }
                    }
                    // 紫色阴影
                    View {
                        attr {
                            size(70f, 70f)
                            backgroundColor(Color.WHITE)
                            boxShadow(BoxShadow(3f, 3f, 10f, Color(0xFF7B1FA2)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("紫")
                                fontSize(14f)
                                color(Color(0xFF7B1FA2))
                            }
                        }
                    }
                }

                // === Section 4: 阴影 + 圆角组合 ===
                Text {
                    attr {
                        text("4. 阴影+圆角组合")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 20f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                    }
                    // 小圆角 + 阴影
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(0f, 4f, 12f, Color(0x40000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("r=8")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 大圆角 + 阴影
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(20f)
                            boxShadow(BoxShadow(0f, 4f, 12f, Color(0x40000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("r=20")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 圆形 + 阴影
                    View {
                        attr {
                            size(80f, 80f)
                            backgroundColor(Color.WHITE)
                            borderRadius(40f)
                            boxShadow(BoxShadow(0f, 4f, 12f, Color(0x40000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("圆形")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                }

                // === Section 5: 阴影强度梯度 ===
                Text {
                    attr {
                        text("5. 阴影强度梯度")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(20f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 20f)
                        alignItemsCenter()
                        justifyContentSpaceAround()
                    }
                    // 无阴影
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            allCenter()
                        }
                        Text {
                            attr {
                                text("无")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 轻阴影
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(0f, 1f, 3f, Color(0x30000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("轻")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 中阴影
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(0f, 4f, 8f, Color(0x50000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("中")
                                fontSize(12f)
                                color(Color.BLACK)
                            }
                        }
                    }
                    // 重阴影
                    View {
                        attr {
                            size(60f, 60f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            boxShadow(BoxShadow(0f, 8f, 16f, Color(0x80000000)))
                            allCenter()
                        }
                        Text {
                            attr {
                                text("重")
                                fontSize(12f)
                                color(Color.BLACK)
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
