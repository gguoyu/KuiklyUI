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

package com.tencent.kuikly.demo.pages.demo.web

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.views.ActivityIndicator
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View
import com.tencent.kuikly.demo.pages.base.BasePager

/**
 * KRActivityIndicatorView 全属性测试页面
 * 覆盖：style (gray/white) 两种模式
 */
@Page("WebRenderTestIndicator")
internal class WebRenderTestIndicatorPage : BasePager() {

    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // 标题
                View {
                    attr {
                        padding(16f)
                        backgroundColor(Color(0xFF607D8B))
                    }
                    Text {
                        attr {
                            text("ActivityIndicator 测试")
                            fontSize(20f)
                            fontWeightBold()
                            color(Color.WHITE)
                        }
                    }
                }

                // 说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFECEFF1))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("📝 ActivityIndicator 是加载指示器组件，\n用于显示加载中的状态。支持 gray 和 white 两种样式。")
                            fontSize(13f)
                            color(Color(0xFF455A64))
                            lineHeight(20f)
                        }
                    }
                }

                // 测试1: style = gray (浅色背景)
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("1. style = gray (浅色背景使用)")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            padding(24f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            alignItemsCenter()
                            justifyContentCenter()
                        }
                        ActivityIndicator {
                            attr {
                                size(40f, 40f)
                                style("gray")
                            }
                        }
                        Text {
                            attr {
                                text("加载中...")
                                fontSize(14f)
                                color(Color(0xFF666666))
                                marginTop(12f)
                            }
                        }
                    }
                }

                // 测试2: style = white (深色背景)
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("2. style = white (深色背景使用)")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            padding(24f)
                            backgroundColor(Color(0xFF333333))
                            borderRadius(8f)
                            alignItemsCenter()
                            justifyContentCenter()
                        }
                        ActivityIndicator {
                            attr {
                                size(40f, 40f)
                                style("white")
                            }
                        }
                        Text {
                            attr {
                                text("加载中...")
                                fontSize(14f)
                                color(Color.WHITE)
                                marginTop(12f)
                            }
                        }
                    }
                }

                // 测试3: 不同尺寸
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("3. 不同尺寸对比")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    View {
                        attr {
                            flexDirectionRow()
                            justifyContentSpaceAround()
                            alignItemsCenter()
                            padding(16f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                        }
                        // 小尺寸
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            ActivityIndicator {
                                attr {
                                    size(20f, 20f)
                                    style("gray")
                                }
                            }
                            Text {
                                attr {
                                    text("20x20")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 中尺寸
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            ActivityIndicator {
                                attr {
                                    size(36f, 36f)
                                    style("gray")
                                }
                            }
                            Text {
                                attr {
                                    text("36x36")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                        // 大尺寸
                        View {
                            attr {
                                alignItemsCenter()
                            }
                            ActivityIndicator {
                                attr {
                                    size(50f, 50f)
                                    style("gray")
                                }
                            }
                            Text {
                                attr {
                                    text("50x50")
                                    fontSize(12f)
                                    color(Color(0xFF999999))
                                    marginTop(8f)
                                }
                            }
                        }
                    }
                }

                // 测试4: 实际应用场景
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("4. 实际应用场景")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(12f)
                        }
                    }
                    // 按钮加载状态
                    View {
                        attr {
                            padding(12f)
                            backgroundColor(Color(0xFF2196F3))
                            borderRadius(24f)
                            flexDirectionRow()
                            alignItemsCenter()
                            justifyContentCenter()
                        }
                        ActivityIndicator {
                            attr {
                                size(20f, 20f)
                                style("white")
                            }
                        }
                        Text {
                            attr {
                                text("提交中...")
                                fontSize(14f)
                                color(Color.WHITE)
                                marginLeft(8f)
                            }
                        }
                    }
                    // 卡片加载状态
                    View {
                        attr {
                            marginTop(12f)
                            padding(40f)
                            backgroundColor(Color.WHITE)
                            borderRadius(8f)
                            alignItemsCenter()
                            justifyContentCenter()
                        }
                        ActivityIndicator {
                            attr {
                                size(32f, 32f)
                                style("gray")
                            }
                        }
                        Text {
                            attr {
                                text("内容加载中...")
                                fontSize(13f)
                                color(Color(0xFF999999))
                                marginTop(12f)
                            }
                        }
                    }
                }

                // 测试5: 属性说明
                View {
                    attr {
                        margin(12f)
                        padding(12f)
                        backgroundColor(Color(0xFFF5F5F5))
                        borderRadius(8f)
                    }
                    Text {
                        attr {
                            text("5. 属性说明")
                            fontSize(14f)
                            fontWeightBold()
                            color(Color(0xFF333333))
                            marginBottom(8f)
                        }
                    }
                    View {
                        attr {
                            padding(8f)
                            backgroundColor(Color.WHITE)
                            borderRadius(4f)
                        }
                        Text {
                            attr {
                                text("""
                                    |• style - 指示器样式
                                    |  - "gray": 灰色，用于浅色背景
                                    |  - "white": 白色，用于深色背景
                                    |
                                    |• size(width, height) - 指示器尺寸
                                    |  - 建议使用正方形尺寸
                                    |  - 常用: 20x20, 36x36, 50x50
                                    |
                                    |• 自动旋转动画
                                    |  - 组件会自动播放旋转动画
                                    |  - 无需额外控制
                                """.trimMargin())
                                fontSize(12f)
                                color(Color(0xFF666666))
                                lineHeight(18f)
                            }
                        }
                    }
                }

                // 底部留白
                View {
                    attr {
                        height(50f)
                    }
                }
            }
        }
    }
}
