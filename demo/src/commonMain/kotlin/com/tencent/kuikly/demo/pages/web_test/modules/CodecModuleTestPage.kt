package com.tencent.kuikly.demo.pages.web_test.modules

import com.tencent.kuikly.core.annotations.Page
import com.tencent.kuikly.core.base.Color
import com.tencent.kuikly.core.base.ViewBuilder
import com.tencent.kuikly.core.module.CodecModule
import com.tencent.kuikly.core.pager.Pager
import com.tencent.kuikly.core.reactive.handler.observable
import com.tencent.kuikly.core.views.List
import com.tencent.kuikly.core.views.Text

@Page("CodecModuleTestPage")
internal class CodecModuleTestPage : Pager() {
    private var urlEncode by observable("")
    private var urlDecode by observable("")
    private var base64Encode by observable("")
    private var base64Decode by observable("")
    private var md5Short by observable("")
    private var md5Long by observable("")
    private var sha256 by observable("")

    override fun created() {
        super.created()
        val module = acquireModule<CodecModule>(CodecModule.MODULE_NAME)
        val sample = "hello kuikly"
        urlEncode = module.urlEncode(sample)
        urlDecode = module.urlDecode(urlEncode)
        base64Encode = module.base64Encode(sample)
        base64Decode = module.base64Decode(base64Encode)
        md5Short = module.md5(sample)
        md5Long = module.md5With32(sample)
        sha256 = module.sha256(sample)
    }

    override fun body(): ViewBuilder {
        val ctx = this
        return {
            List {
                attr {
                    flex(1f)
                    backgroundColor(Color.WHITE)
                }
                Text { attr { text("CodecModuleTestPage"); color(Color.BLACK); marginTop(20f); marginLeft(16f) } }
                Text { attr { text("urlEncode:${ctx.urlEncode}"); margin(left = 16f, top = 16f) } }
                Text { attr { text("urlDecode:${ctx.urlDecode}"); margin(left = 16f, top = 12f) } }
                Text { attr { text("base64Encode:${ctx.base64Encode}"); margin(left = 16f, top = 12f) } }
                Text { attr { text("base64Decode:${ctx.base64Decode}"); margin(left = 16f, top = 12f) } }
                Text { attr { text("md5(16):${ctx.md5Short}"); margin(left = 16f, top = 12f) } }
                Text { attr { text("md5(32):${ctx.md5Long}"); margin(left = 16f, top = 12f) } }
                Text { attr { text("sha256:${ctx.sha256}"); margin(left = 16f, top = 12f) } }
            }
        }
    }
}
