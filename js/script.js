// Função para carregar os dados do Local Storage
function carregarDados(chave) {
    return JSON.parse(localStorage.getItem(chave)) || [];
}

// Função para salvar os dados no Local Storage
function salvarDados(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

// Função para verificar a sessão do usuário
function verificarSessao() {
    const usuarioLogado = carregarDados('usuarioLogado');
    if (!usuarioLogado || !usuarioLogado.email) {
        window.location.href = 'login.html';
    }
}

// Função para carregar a navbar e verificar permissões
function carregarNavbar() {
    fetch('navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-container').innerHTML = data;
            const usuarioLogado = carregarDados('usuarioLogado');
            if (usuarioLogado.admin !== 'S') {
                document.querySelectorAll('.admin-only').forEach(el => el.remove());
            }
            document.getElementById('logoutBtn').addEventListener('click', function() {
                localStorage.removeItem('usuarioLogado');
                window.location.href = 'login.html';
            });
        });
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
                <button class="btn btn-primary agendar-btn" data-sala="${sala.nomeEspaco}" data-valor="${sala.valor}" data-date="${dateStr}" data-periodo-max="${sala.periodoMax}">Agendar</button>
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
            const periodoMax = this.getAttribute('data-periodo-max');
            abrirPopupAgendamento(sala, valor, date, periodoMax);
        });
    });
}

// Função para abrir o popup de confirmação de agendamento
function abrirPopupAgendamento(sala, valor, date, periodoMax) {
    const agendarInfo = document.getElementById('agendarInfo');
    const horariosDisponiveisEl = document.getElementById('horariosDisponiveis');
    if (agendarInfo && horariosDisponiveisEl) {
        let horarioOptions = '';
        const agendamentos = carregarDados('agendamentos');

        const periodo = parseInt(periodoMax, 10);
        for (let hora = 7; hora <= 23; hora += periodo) {
            const isAgendado = agendamentos.some(agendamento => {
                const agendamentoInicio = agendamento.hora;
                const agendamentoFim = parseInt(agendamento.hora) + parseInt(agendamento.periodo);
                const horaFim = hora + periodo;
                return agendamento.sala === sala && agendamento.date === date && (
                    (hora >= agendamentoInicio && hora < agendamentoFim) ||
                    (horaFim > agendamentoInicio && horaFim <= agendamentoFim)
                );
            });
            if (!isAgendado) {
                horarioOptions += `<div class="form-check">
                    <input class="form-check-input" type="radio" name="horario" id="horario${hora}" value="${hora}">
                    <label class="form-check-label" for="horario${hora}">
                        ${hora}:00 - ${hora + periodo}:00
                    </label>
                </div>`;
            } else {
                horarioOptions += `<div class="form-check">
                    <input class="form-check-input" type="radio" name="horario" id="horario${hora}" value="${hora}" disabled>
                    <label class="form-check-label text-danger" for="horario${hora}">
                        ${hora}:00 - ${hora + periodo}:00 (Horário agendado)
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
                abrirModalPagamento(sala, valor, date, horarioSelecionado, periodoMax);
            } else {
                alert('Por favor, selecione um horário.');
            }
        };
    }
}

// Função para abrir o modal de pagamento
function abrirModalPagamento(sala, valor, date, horario, periodoMax) {
    $('#pagamentoModal').modal('show');
    document.getElementById('confirmarPagamento').onclick = function() {
        agendarSala(sala, date, horario, periodoMax);
    };
}

// Função para agendar uma sala
function agendarSala(sala, date, hora, periodoMax) {
    const usuarioLogado = carregarDados('usuarioLogado');
    const agendamentos = carregarDados('agendamentos');
    agendamentos.push({ sala, date, hora, usuario: usuarioLogado.nome, periodo: periodoMax });
    salvarDados('agendamentos', agendamentos);
    alert(`Sala ${sala} agendada para ${date} das ${hora}:00 às ${parseInt(hora) + parseInt(periodoMax)}:00`);
    $('#pagamentoModal').modal('hide');
    exibirSalasDisponiveis(date); // Atualiza a lista de salas disponíveis
}

// Função para inicializar a página de salas agendadas
function inicializarSalasAgendadas() {
    const agendamentos = carregarDados('agendamentos');
    const listaSalasAgendadasEl = document.getElementById('listaSalasAgendadas');
    listaSalasAgendadasEl.innerHTML = '';

    agendamentos.forEach((agendamento, index) => {
        const agendamentoEl = document.createElement('div');
        agendamentoEl.className = 'card mb-2';
        agendamentoEl.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${agendamento.sala}</h5>
                <p class="card-text">Data: ${agendamento.date}</p>
                <p class="card-text">Horário agendado: ${agendamento.hora}:00 às ${parseInt(agendamento.hora) + parseInt(agendamento.periodo)}:00</p>
                <p class="card-text">Usuário: ${agendamento.usuario}</p>
                <button class="btn btn-warning btn-sm edit-agendamento-btn" data-index="${index}">Editar</button>
                <button class="btn btn-danger btn-sm delete-agendamento-btn" data-index="${index}">Excluir</button>
            </div>
        `;
        listaSalasAgendadasEl.appendChild(agendamentoEl);
    });

    // Adiciona eventos de clique para os botões de editar e excluir
    document.querySelectorAll('.edit-agendamento-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            editarAgendamento(index);
        });
    });

    document.querySelectorAll('.delete-agendamento-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            excluirAgendamento(index);
        });
    });
}

// Função para editar agendamento
function editarAgendamento(index) {
    const agendamentos = carregarDados('agendamentos');
    const agendamento = agendamentos[index];

    document.getElementById('editSala').value = agendamento.sala;
    document.getElementById('editData').value = agendamento.date;
    document.getElementById('editHora').value = agendamento.hora;
    document.getElementById('editIndex').value = index;

    $('#editAgendamentoModal').modal('show');
}

// Função para excluir agendamento
function excluirAgendamento(index) {
    const confirmDeleteAgendamento = document.getElementById('confirmDeleteAgendamento');
    if (confirmDeleteAgendamento) {
        confirmDeleteAgendamento.setAttribute('data-index', index);
        $('#deleteAgendamentoModal').modal('show');
    }
}

// Função para salvar as alterações da edição de agendamento
document.addEventListener('DOMContentLoaded', function() {
    const formEditarAgendamento = document.getElementById('formEditarAgendamento');
    if (formEditarAgendamento) {
        formEditarAgendamento.addEventListener('submit', function(event) {
            event.preventDefault();
            const index = document.getElementById('editIndex').value;
            const agendamentos = carregarDados('agendamentos');

            agendamentos[index].date = document.getElementById('editData').value;
            agendamentos[index].hora = document.getElementById('editHora').value;

            salvarDados('agendamentos', agendamentos);
            $('#editAgendamentoModal').modal('hide');
            alert('Agendamento editado com sucesso!');
            inicializarSalasAgendadas(); // Atualiza a lista após a edição
        });
    }

    const confirmDeleteAgendamento = document.getElementById('confirmDeleteAgendamento');
    if (confirmDeleteAgendamento) {
        confirmDeleteAgendamento.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            const agendamentos = carregarDados('agendamentos');
            agendamentos.splice(index, 1);

            salvarDados('agendamentos', agendamentos);
            $('#deleteAgendamentoModal').modal('hide');
            alert('Agendamento excluído com sucesso!');
            inicializarSalasAgendadas(); // Atualiza a lista após a exclusão
        });
    }

    // Inicializa a página de salas agendadas ao carregar a página
    if (document.getElementById('listaSalasAgendadas')) {
        inicializarSalasAgendadas();
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
    const formCadastroSalas = document.getElementById('formCadastroSalas');
    const formEditarSala = document.getElementById('formEditarSala');

    if (formCadastroSalas) {
        formCadastroSalas.addEventListener('submit', cadastrarSala);
    }

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

    // Carrega a navbar e verifica permissões
    if (document.getElementById('navbar-container')) {
        carregarNavbar();
    }

    // Inicializa o calendário ao carregar a página
    if (document.getElementById('calendar')) {
        inicializarCalendario();
    }

    // Inicializa a página de perfil ao carregar a página
    if (document.getElementById('formEditarPerfil')) {
        inicializarPerfil();
    }
});

// Função para inicializar a página de perfil
function inicializarPerfil() {
    const usuarioLogado = carregarDados('usuarioLogado');
    document.getElementById('nome').value = usuarioLogado.nome;
    document.getElementById('email').value = usuarioLogado.email;
    document.getElementById('telefone').value = usuarioLogado.telefone;
    document.getElementById('areaAtuacao').value = usuarioLogado.areaAtuacao;
    document.getElementById('estado').value = usuarioLogado.estado;
    document.getElementById('cidade').value = usuarioLogado.cidade;

    const adminField = document.querySelector('.admin-field');
    if (usuarioLogado.admin === 'S') {
        document.getElementById('admin').value = usuarioLogado.admin;
        adminField.style.display = 'block';
        inicializarListaUsuarios();
    } else {
        adminField.style.display = 'none';
    }

    document.getElementById('formEditarPerfil').addEventListener('submit', function(event) {
        event.preventDefault();
        atualizarPerfil();
    });
}

// Função para atualizar o perfil do usuário
function atualizarPerfil() {
    const usuarioLogado = carregarDados('usuarioLogado');
    usuarioLogado.nome = document.getElementById('nome').value;
    usuarioLogado.email = document.getElementById('email').value;
    usuarioLogado.telefone = document.getElementById('telefone').value;
    usuarioLogado.areaAtuacao = document.getElementById('areaAtuacao').value;
    usuarioLogado.estado = document.getElementById('estado').value;
    usuarioLogado.cidade = document.getElementById('cidade').value;

    if (usuarioLogado.admin === 'S') {
        usuarioLogado.admin = document.getElementById('admin').value;
    }

    let usuarios = carregarDados('usuarios');
    const index = usuarios.findIndex(u => u.email === usuarioLogado.email);
    if (index !== -1) {
        usuarios[index] = usuarioLogado;
    }

    salvarDados('usuarios', usuarios);
    salvarDados('usuarioLogado', usuarioLogado);
    alert('Perfil atualizado com sucesso!');
}

// Função para inicializar a lista de usuários para administradores
function inicializarListaUsuarios() {
    const listaUsuariosEl = document.getElementById('listaUsuarios');
    const listaUsuariosContainer = document.getElementById('listaUsuariosContainer');
    listaUsuariosContainer.style.display = 'block';

    const usuarios = carregarDados('usuarios');
    listaUsuariosEl.innerHTML = '';

    usuarios.forEach((usuario, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${usuario.nome}</td>
            <td>${usuario.email}</td>
            <td>${usuario.telefone}</td>
            <td>${usuario.areaAtuacao}</td>
            <td>${usuario.estado}</td>
            <td>${usuario.cidade}</td>
            <td>${usuario.admin === 'S' ? 'Sim' : 'Não'}</td>
            <td>
                <button class="btn btn-warning btn-sm edit-user-btn" data-index="${index}">Editar</button>
                <button class="btn btn-danger btn-sm delete-user-btn" data-index="${index}">Excluir</button>
            </td>
        `;
        listaUsuariosEl.appendChild(row);
    });

    // Adiciona eventos de clique para os botões de editar e excluir
    document.querySelectorAll('.edit-user-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            editarUsuario(index);
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = this.getAttribute('data-index');
            excluirUsuario(index);
        });
    });
}

// Função para editar usuário
function editarUsuario(index) {
    const usuarios = carregarDados('usuarios');
    const usuario = usuarios[index];

    document.getElementById('editNome').value = usuario.nome;
    document.getElementById('editEmail').value = usuario.email;
    document.getElementById('editTelefone').value = usuario.telefone;
    document.getElementById('editAreaAtuacao').value = usuario.areaAtuacao;
    document.getElementById('editEstado').value = usuario.estado;
    document.getElementById('editCidade').value = usuario.cidade;
    document.getElementById('editAdmin').value = usuario.admin;
    document.getElementById('editIndex').value = index;

    $('#editUserModal').modal('show');
}

// Função para salvar as alterações da edição de usuário
document.addEventListener('DOMContentLoaded', function() {
    const formEditarUsuario = document.getElementById('formEditarUsuario');
    if (formEditarUsuario) {
        formEditarUsuario.addEventListener('submit', function(event) {
            event.preventDefault();
            const index = document.getElementById('editIndex').value;
            const usuarios = carregarDados('usuarios');

            usuarios[index].nome = document.getElementById('editNome').value;
            usuarios[index].email = document.getElementById('editEmail').value;
            usuarios[index].telefone = document.getElementById('editTelefone').value;
            usuarios[index].areaAtuacao = document.getElementById('editAreaAtuacao').value;
            usuarios[index].estado = document.getElementById('editEstado').value;
            usuarios[index].cidade = document.getElementById('editCidade').value;
            usuarios[index].admin = document.getElementById('editAdmin').value;

            salvarDados('usuarios', usuarios);
            $('#editUserModal').modal('hide');
            alert('Usuário editado com sucesso!');
            inicializarListaUsuarios(); // Atualiza a lista após a edição
        });
    }

    const confirmDeleteUser = document.getElementById('confirmDeleteUser');
    if (confirmDeleteUser) {
        confirmDeleteUser.addEventListener('click', function() {
            const index = document.getElementById('deleteIndex').value;
            const usuarios = carregarDados('usuarios');
            usuarios.splice(index, 1);

            salvarDados('usuarios', usuarios);
            $('#deleteUserModal').modal('hide');
            alert('Usuário excluído com sucesso!');
            inicializarListaUsuarios(); // Atualiza a lista após a exclusão
        });
    }
});

// Função para excluir usuário
function excluirUsuario(index) {
    const confirmDeleteUser = document.getElementById('confirmDeleteUser');
    if (confirmDeleteUser) {
        confirmDeleteUser.setAttribute('data-index', index);
        document.getElementById('deleteIndex').value = index;
        $('#deleteUserModal').modal('show');
    }
}

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

// Mostrar e esconder formulários de login e cadastro
document.addEventListener('DOMContentLoaded', function() {
    const formCadastroUsuario = document.getElementById('formCadastroUsuario');
    const formLogin = document.getElementById('formLogin');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');

    if (formCadastroUsuario) {
        formCadastroUsuario.addEventListener('submit', cadastrarUsuario);
    }

    if (formLogin) {
        formLogin.addEventListener('submit', logarUsuario);
    }

    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'block';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        });
    }

    // Inicializa o calendário ao carregar a página
    if (document.getElementById('calendar')) {
        inicializarCalendario();
    }

    // Atualiza a tabela ao carregar a página
    if (document.getElementById('salasCadastradas')) {
        atualizarTabelaSalas();
    }

    // Carrega a navbar e verifica permissões
    if (document.getElementById('navbar-container')) {
        carregarNavbar();
    }

    // Inicializa a página de perfil ao carregar a página
    if (document.getElementById('formEditarPerfil')) {
        inicializarPerfil();
    }
});
