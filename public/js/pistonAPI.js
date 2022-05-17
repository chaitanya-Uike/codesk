class Piston {
    constructor() {
        this.executionURL = "https://emkc.org/api/v2/piston/execute"
        this.runtimeURL = "https://emkc.org/api/v2/piston/runtimes"
        this.runtimes = {}

        this.getRuntimes()
    }

    getRuntimes() {
        var myHeaders = new Headers()

        var requestOptions = {
            method: 'GET',
            headers: myHeaders,
            redirect: 'follow'
        }

        fetch(this.runtimeURL, requestOptions)
            .then(response => response.text())
            .then(response => {
                const runtimeRes = JSON.parse(response)
                runtimeRes.forEach(element => {
                    this.runtimes[element.language] = element.version;
                })
            })
    }

    async runCode(language, code, input) {
        if (code) {
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const raw = JSON.stringify({
                "language": language,
                "version": this.runtimes[language],
                "files": [
                    {
                        "content": `${code}`
                    }
                ],
                "stdin": input,
                "compile_timeout": 10000,
                "run_timeout": 3000,
                "compile_memory_limit": -1,
                "run_memory_limit": -1
            });

            const requestOptions = {
                method: 'POST',
                headers: myHeaders,
                body: raw,
                redirect: 'follow'
            }


            const res = await fetch(this.executionURL, requestOptions)
            const data = await res.text()
            const output = JSON.parse(data).run.output;

            return output;
        }
    }
}