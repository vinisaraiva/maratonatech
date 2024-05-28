// Função para salvar os dados no Local Storage
function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

// Função para carregar os dados do Local Storage
function carregarDados(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
}

// Função para inicializar o calendário
function inicializarCalendario() {
    $('#calendar').fullCalendar({
        header: {
            left: 'prev,next today',
            center: 'title',
            right: 'month,agendaWeek,agendaDay'
        },
        selectable: true,
        selectHelper: true,
        dayClick: function(date) {
            const dateStr = date.format('YYYY-MM-DD');
            exibirSalasDisponiveis(dateStr);
        },
        editable: true,
        eventLimit: true
    });
}

// Função para exibir as salas disponíveis
function exibirSalasDisponiveis(dateStr) {
    const salas = carregarDados('salas');
    const agendamentos = carregarDados('agendamentos');
    const salasDisponiveisEl = document.getElementById('salaDisponiveis');
    salasDisponiveisEl.innerHTML = `<h2 class="mt-4">Salas disponíveis em ${dateStr}</h2>`;

    salas.forEach(sala => {
        const salaEl = document.createElement('div');
        salaEl.className = 'card mb-2';
        salaEl.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${sala.nomeEspaco}</h5>
                <p class="card-text">${sala.estrutura}</p>
                <p class="card-text"><strong>Valor: R$ ${sala.valor}</strong></p>
                <button class="btn btn-primary agendar-btn" data-sala="${sala.nomeEspaco}" data-valor="${sala.valor}" data-date="${dateStr}">Agendar</button>
            </div>
        `;
        salasDisponiveisEl.appendChild(salaEl);
    });

    // Adiciona evento de clique para os botões de agendamento
    document.querySelectorAll('.agendar-btn').forEach(button => {
        button.addEventListener('click', function() {
            const sala = this.getAttribute('data-sala');
            const valor = this.getAttribute('data-valor');
            const date = this.getAttribute('data-date');
            abrirPopupAgendamento(sala, valor, date);
        });
    });
}

// Função para abrir o popup de confirmação de agendamento
function abrirPopupAgendamento(sala, valor, date) {
    const agendarInfo = document.getElementById('agendarInfo');
    const horariosDisponiveisEl = document.getElementById('horariosDisponiveis');
    if (agendarInfo && horariosDisponiveisEl) {
        let horarioOptions = '';
        const agendamentos = carregarDados('agendamentos');

        for (let hora = 7; hora <= 23; hora++) {
            const isAgendado = agendamentos.some(agendamento => agendamento.sala === sala && agendamento.date === date && agendamento.hora === hora);
            if (isAgendado) {
                horarioOptions += `<div class="form-check">
                    <input class="form-check-input" type="radio" name="horario" id="horario${hora}" value="${hora}" disabled>
                    <label class="form-check-label text-danger font-weight-bold" for="horario${hora}">
                        ${hora}:00 - ${hora + 1}:00 <span class="text-danger">(Horário agendado)</span>
                    </label>
                </div>`;
            } else {
                horarioOptions += `<div class="form-check">
                    <input class="form-check-input" type="radio" name="horario" id="horario${hora}" value="${hora}">
                    <label class="form-check-label" for="horario${hora}">
                        ${hora}:00 - ${hora + 1}:00
                    </label>
                </div>`;
            }
        }

        agendarInfo.innerHTML = `Nome da Sala: ${sala}<br>Valor: R$ ${valor}<br>Data: ${date}`;
        horariosDisponiveisEl.innerHTML = `<h5>Horários Disponíveis:</h5>${horarioOptions}`;
        $('#agendarModal').modal('show');

        document.getElementById('confirmAgendar').onclick = function() {
            const horarioSelecionado = document.querySelector('input[name="horario"]:checked').value;
            if (horarioSelecionado) {
                $('#agendarModal').modal('hide');
                abrirModalPagamento(sala, valor, date, horarioSelecionado);
            } else {
                alert('Por favor, selecione um horário.');
            }
        };
    }
}

// Função para abrir o modal de pagamento
function abrirModalPagamento(sala, valor, date, horario) {
    $('#pagamentoModal').modal('show');
    document.getElementById('confirmarPagamento').onclick = function() {
        agendarSala(sala, date, horario);
    };
}

// Função para agendar uma sala
function agendarSala(sala, date, hora) {
    const agendamentos = carregarDados('agendamentos');
    agendamentos.push({ sala, date, hora });
    salvarDados('agendamentos', agendamentos);
    alert(`Sala ${sala} agendada para ${date} às ${hora}:00`);
    $('#pagamentoModal').modal('hide');
    exibirSalasDisponiveis(date); // Atualiza a lista de salas disponíveis
}

// Inicializa o calendário ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('calendar')) {
        inicializarCalendario();
    }
});

// Função para cadastrar sala
function cadastrarSala(event) {
    event.preventDefault();
    const sala = {
        nomeEspaco: document.getElementById('nomeEspaco').value,
        estrutura: document.getElementById('estrutura').value,
        valor: document.getElementById('valor').value,
        periodoMax: document.getElementById('periodoMax').value
    };
    const salas = carregarDados('salas');
    salas.push(sala);
    salvarDados('salas', salas);
    alert('Sala cadastrada com sucesso!');
    document.getElementById('formCadastroSalas').reset();
    atualizarTabelaSalas(); // Atualiza a tabela após o cadastro
}

// Função para atualizar a tabela de salas cadastradas
function atualizarTabelaSalas() {
    const salas = carregarDados('salas');
    const salasCadastradasEl = document.getElementById('salasCadastradas');
    if (!salasCadastradasEl) return; // Se o elemento não existir, não faça nada

    salasCadastradasEl.innerHTML = '';

    salas.forEach((sala, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sala.nomeEspaco}</td>
            <td>${sala.estrutura}</td>
            <td>R$ ${sala.valor}</td>
            <td>${sala.periodoMax} horas</td>
            <td>
                <button class="btn btn-warning btn-sm edit-btn" data-index="${index}">Editar</button>
                <button class="btn btn-danger btn-sm delete-btn" data-index="${index}">Excluir</button>
            </td>
        `;
        salasCadastradasEl.appendChild(row);
    });

    // Adiciona eventos de clique para os botões de editar e excluir
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            editarSala(index);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            excluirSala(index);
        });
    });
}

// Função para editar sala
function editarSala(index) {
    const salas = carregarDados('salas');
    const sala = salas[index];

    document.getElementById('editNomeEspaco').value = sala.nomeEspaco;
    document.getElementById('editEstrutura').value = sala.estrutura;
    document.getElementById('editValor').value = sala.valor;
    document.getElementById('editPeriodoMax').value = sala.periodoMax;
    document.getElementById('editIndex').value = index;

    $('#editModal').modal('show');
}

// Função para excluir sala
function excluirSala(index) {
    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.setAttribute('data-index', index);
        $('#deleteModal').modal('show');
    }
}

// Função para salvar as alterações da edição
document.addEventListener('DOMContentLoaded', function() {
    const formEditarSala = document.getElementById('formEditarSala');
    if (formEditarSala) {
        formEditarSala.addEventListener('submit', function(event) {
            event.preventDefault();
            const index = document.getElementById('editIndex').value;
            const salas = carregarDados('salas');

            salas[index].nomeEspaco = document.getElementById('editNomeEspaco').value;
            salas[index].estrutura = document.getElementById('editEstrutura').value;
            salas[index].valor = document.getElementById('editValor').value;
            salas[index].periodoMax = document.getElementById('editPeriodoMax').value;

            salvarDados('salas', salas);
            $('#editModal').modal('hide');
            alert('Sala editada com sucesso!');
            atualizarTabelaSalas(); // Atualiza a tabela após a edição
        });
    }

    const confirmDelete = document.getElementById('confirmDelete');
    if (confirmDelete) {
        confirmDelete.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const salas = carregarDados('salas');
            salas.splice(index, 1);

            salvarDados('salas', salas);
            $('#deleteModal').modal('hide');
            alert('Sala excluída com sucesso!');
            atualizarTabelaSalas(); // Atualiza a tabela após a exclusão
        });
    }

    // Atualiza a tabela ao carregar a página
    atualizarTabelaSalas();
});

// Função para cadastrar usuário
function cadastrarUsuario(event) {
    event.preventDefault();
    const usuario = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        telefone: document.getElementById('telefone').value,
        areaAtuacao: document.getElementById('areaAtuacao').value,
        estado: document.getElementById('estado').value,
        cidade: document.getElementById('cidade').value,
        senha: document.getElementById('senha').value,
        admin: document.getElementById('admin').value
    };
    const usuarios = carregarDados('usuarios');
    usuarios.push(usuario);
    salvarDados('usuarios', usuarios);
    alert('Usuário cadastrado com sucesso!');
    document.getElementById('formCadastroUsuario').reset();
}

// Função para logar usuário
function logarUsuario(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const senha = document.getElementById('loginSenha').value;
    const usuarios = carregarDados('usuarios');
    const usuario = usuarios.find(u => u.email === email && u.senha === senha);

    if (usuario) {
        salvarDados('usuarioLogado', usuario);
        alert('Login realizado com sucesso!');
        window.location.href = 'index.html';
    } else {
        alert('Email ou senha incorretos!');
    }
}

// Verificar se os formulários existem antes de adicionar os listeners
document.addEventListener('DOMContentLoaded', () => {
    const formCadastroUsuario = document.getElementById('formCadastroUsuario');
    const formLogin = document.getElementById('formLogin');

    if (formCadastroUsuario) {
        formCadastroUsuario.addEventListener('submit', cadastrarUsuario);
    }

    if (formLogin) {
        formLogin.addEventListener('submit', logarUsuario);
    }
});
