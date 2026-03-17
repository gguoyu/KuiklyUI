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
import com.tencent.kuikly.core.base.BorderRectRadius
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text
import com.tencent.kuikly.core.views.View

/**
 * Overflow 溢出渲染验证测试页面
 *
 * 测试覆盖：
 * 1. overflow(false) — 裁剪子元素（不允许溢出）
 * 2. overflow(true) — 允许子元素溢出
 * 3. borderRadius + overflow 裁剪组合
 * 4. 不等圆角裁剪
 *
 * 注意：Kuikly DSL 中 overflow(clipChild: Boolean)
 *   - true = 允许子元素溢出容器（不裁剪）
 *   - false = 裁剪子元素（不允许溢出）
 */
@Page("OverflowTestPage")
internal class OverflowTestPage : Pager() {
    override fun body(): ViewBuilder {
        return {
            attr {
                backgroundColor(Color.WHITE)
            }

            List {
                attr {
                    flex(1f)
                }

                // === Section 1: overflow(false) 裁剪 ===
                Text {
                    attr {
                        text("1. overflow裁剪")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                Text {
                    attr {
                        text("子元素超出部分被裁剪")
                        fontSize(12f)
                        marginLeft(16f)
                        marginTop(4f)
                        color(Color(0xFF757575))
                    }
                }
                View {
                    attr {
                        padding(all = 16f)
                        height(140f)
                    }
                    // 容器: 裁剪子元素
                    View {
                        attr {
                            size(150f, 100f)
                            backgroundColor(0xFFE3F2FD)
                            overflow(false)
                        }
                        // 子元素超出右边
                        View {
                            attr {
                                size(100f, 60f)
                                backgroundColor(0xFF42A5F5)
                                absolutePosition(left = 80f, top = 20f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("裁剪")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                }
                            }
                        }
                        // 子元素超出底部
                        View {
                            attr {
                                size(60f, 60f)
                                backgroundColor(0xFFEF5350)
                                absolutePosition(left = 10f, top = 60f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("裁剪")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                }
                            }
                        }
                    }
                }

                // === Section 2: overflow(true) 溢出 ===
                Text {
                    attr {
                        text("2. overflow溢出")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                Text {
                    attr {
                        text("子元素超出部分可见")
                        fontSize(12f)
                        marginLeft(16f)
                        marginTop(4f)
                        color(Color(0xFF757575))
                    }
                }
                View {
                    attr {
                        padding(all = 16f)
                        height(160f)
                    }
                    // 容器: 允许溢出
                    View {
                        attr {
                            size(150f, 100f)
                            backgroundColor(0xFFFCE4EC)
                            overflow(true)
                        }
                        // 子元素超出右边（可见）
                        View {
                            attr {
                                size(100f, 60f)
                                backgroundColor(0xFFE91E63)
                                absolutePosition(left = 80f, top = 20f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("溢出")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                }
                            }
                        }
                        // 子元素超出底部（可见）
                        View {
                            attr {
                                size(60f, 60f)
                                backgroundColor(0xFFF44336)
                                absolutePosition(left = 10f, top = 60f)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("溢出")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                }
                            }
                        }
                    }
                }

                // === Section 3: borderRadius + overflow 裁剪组合 ===
                Text {
                    attr {
                        text("3. 圆角+裁剪组合")
                        fontSize(16f)
                        fontWeightBold()
                        marginTop(16f)
                        marginLeft(16f)
                        color(Color.BLACK)
                    }
                }
                Text {
                    attr {
                        text("圆角容器裁剪超出的子元素")
                        fontSize(12f)
                        marginLeft(16f)
                        marginTop(4f)
                        color(Color(0xFF757575))
                    }
                }
                View {
                    attr {
                        flexDirectionRow()
                        padding(all = 16f)
                        alignItemsCenter()
                    }
                    // 圆角矩形裁剪
                    View {
                        attr {
                            size(100f, 100f)
                            backgroundColor(0xFFE8F5E9)
                            borderRadius(16f)
                            overflow(false)
                        }
                        // 子元素在四个角 —— 被圆角裁剪
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFF4CAF50)
                                absolutePosition(left = 0f, top = 0f)
                            }
                        }
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFF66BB6A)
                                absolutePosition(left = 60f, top = 0f)
                            }
                        }
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFF81C784)
                                absolutePosition(left = 0f, top = 60f)
                            }
                        }
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFFA5D6A7)
                                absolutePosition(left = 60f, top = 60f)
                            }
                        }
                    }

                    // 圆形裁剪
                    View {
                        attr {
                            size(100f, 100f)
                            backgroundColor(0xFFFFF3E0)
                            borderRadius(50f)
                            overflow(false)
                            marginLeft(16f)
                        }
                        // 大矩形子元素 — 被圆形裁剪
                        View {
                            attr {
                                size(100f, 100f)
                                backgroundColor(0xFFFF9800)
                                allCenter()
                            }
                            Text {
                                attr {
                                    text("圆形裁剪")
                                    fontSize(12f)
                                    color(Color.WHITE)
                                    fontWeightBold()
                                }
                            }
                        }
                    }
                }

                // === Section 4: 不等圆角裁剪 ===
                Text {
                    attr {
                        text("4. 不等圆角裁剪")
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
                            size(120f, 80f)
                            backgroundColor(0xFF1ABC9C)
                            borderRadius(
                                BorderRectRadius(
                                    topLeftCornerRadius = 40f,
                                    topRightCornerRadius = 5f,
                                    bottomLeftCornerRadius = 5f,
                                    bottomRightCornerRadius = 40f
                                )
                            )
                            overflow(false)
                        }
                        // 子元素在左上角 — 被大圆角裁剪
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFFE67E22)
                                absolutePosition(top = 0f, left = 0f)
                            }
                        }
                        // 子元素在右下角 — 被大圆角裁剪
                        View {
                            attr {
                                size(40f, 40f)
                                backgroundColor(0xFFE74C3C)
                                absolutePosition(top = 40f, left = 80f)
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
